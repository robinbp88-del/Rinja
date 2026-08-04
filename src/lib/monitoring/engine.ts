import { createHash } from "node:crypto";
import { changeSummary, valuesEqual } from "./compare";
import {
  extractValue,
  fetchPageHtml,
  pageContainsText,
  pageFingerprint,
  scoreFetchedHtml,
} from "./extract";
import { MonitorError, toMonitorError, type MonitorErrorCode } from "./errors";
import { sendImmediateChangeEmail } from "../digest";
import { sendPushToUser } from "../push.server";
import type { WatchFrequency, WatchMode } from "../watch-mode";
import { createServiceClient } from "../supabase.server";

const FREQ_MS: Record<WatchFrequency, number> = {
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
};

export function frequencyMs(frequency: string | null | undefined): number {
  return FREQ_MS[(frequency as WatchFrequency) ?? "15m"] ?? FREQ_MS["15m"];
}

export function isWatchDue(
  lastChecked: string | null | undefined,
  createdAt: string,
  frequency: string | null | undefined,
  now = Date.now(),
): boolean {
  const interval = frequencyMs(frequency);
  const baseline = lastChecked ?? createdAt;
  const last = new Date(baseline).getTime();
  if (Number.isNaN(last)) return true;
  return now - last >= interval;
}

export type WatchRow = {
  id: string;
  user_id: string;
  url: string;
  host: string | null;
  label: string;
  current_value: string | null;
  previous_value?: string | null;
  selector: string | null;
  element_text: string | null;
  element_tag: string | null;
  mode: WatchMode | string | null;
  frequency: WatchFrequency | string | null;
  paused: boolean;
  notify: boolean | null;
  created_at: string;
  last_checked: string | null;
  last_attempted_at?: string | null;
  last_success_at?: string | null;
  last_error?: string | null;
  last_error_code?: string | null;
  consecutive_failures?: number | null;
  check_status?: string | null;
  baseline_pending?: boolean | null;
};

export type CheckResult =
  | { watchId: string; status: "unchanged" }
  | {
      watchId: string;
      status: "changed";
      oldValue: string | null;
      newValue: string;
      notified?: boolean;
    }
  | { watchId: string; status: "baseline" }
  | { watchId: string; status: "error"; message: string; code?: MonitorErrorCode }
  | { watchId: string; status: "skipped"; reason: string };

function isPageWatch(watch: WatchRow) {
  return watch.mode === "page" || watch.element_tag === "page";
}

function dedupeKey(watchId: string, oldValue: string | null, newValue: string): string {
  return createHash("sha256")
    .update(`${watchId}|${oldValue ?? ""}|${newValue}`)
    .digest("hex")
    .slice(0, 40);
}

/** Exported for unit tests. */
export function notificationDedupeKey(
  watchId: string,
  oldValue: string | null,
  newValue: string,
): string {
  return dedupeKey(watchId, oldValue, newValue);
}

function isMissingRpc(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("could not find the function") ||
    m.includes("does not exist") ||
    m.includes("schema cache")
  );
}

async function applyResult(
  supabase: ReturnType<typeof createServiceClient>,
  args: {
    watchId: string;
    outcome: "baseline" | "unchanged" | "changed" | "error";
    newValue?: string | null;
    errorCode?: string | null;
    errorMessage?: string | null;
    notify?: boolean;
    title?: string | null;
    body?: string | null;
    dedupeKey?: string | null;
    userId?: string;
    oldValue?: string | null;
  },
) {
  const { data, error } = await supabase.rpc("apply_watch_check_result", {
    p_watch_id: args.watchId,
    p_outcome: args.outcome,
    p_new_value: args.newValue ?? null,
    p_error_code: args.errorCode ?? null,
    p_error_message: args.errorMessage ?? null,
    p_notify: args.notify ?? true,
    p_title: args.title ?? null,
    p_body: args.body ?? null,
    p_dedupe_key: args.dedupeKey ?? null,
  });

  if (error) {
    if (isMissingRpc(error.message)) {
      console.warn("apply_watch_check_result unavailable, using legacy write:", error.message);
      return applyResultLegacy(supabase, args);
    }
    console.error("apply_watch_check_result failed:", error.message);
    throw new MonitorError("db", "Could not save check result");
  }

  return data as { ok?: boolean; outcome?: string; notified?: boolean };
}

/** Pre-migration path: update core fields + optional notification insert. */
async function applyResultLegacy(
  supabase: ReturnType<typeof createServiceClient>,
  args: {
    watchId: string;
    outcome: "baseline" | "unchanged" | "changed" | "error";
    newValue?: string | null;
    errorCode?: string | null;
    errorMessage?: string | null;
    notify?: boolean;
    title?: string | null;
    body?: string | null;
    dedupeKey?: string | null;
    userId?: string;
    oldValue?: string | null;
  },
): Promise<{ ok?: boolean; outcome?: string; notified?: boolean }> {
  const now = new Date().toISOString();

  if (args.outcome === "error") {
    const { data: row } = await supabase
      .from("watches")
      .select("consecutive_failures")
      .eq("id", args.watchId)
      .maybeSingle();
    const fails = (row?.consecutive_failures ?? 0) + 1;
    const checkStatus =
      args.errorCode === "http_403" || args.errorCode === "http_429" || args.errorCode === "blocked"
        ? "blocked"
        : args.errorCode === "js_shell" ||
            args.errorCode === "empty_html" ||
            args.errorCode === "unsupported"
          ? "unsupported"
          : "error";

    const { error } = await supabase
      .from("watches")
      .update({
        last_checked: now,
        updated_at: now,
        last_attempted_at: now,
        check_status: checkStatus,
        last_error: (args.errorMessage ?? "Check failed").slice(0, 500),
        last_error_code: args.errorCode ?? "unknown",
        consecutive_failures: fails,
        locked_at: null,
        locked_by: null,
      })
      .eq("id", args.watchId);
    if (error) throw new MonitorError("db", "Could not save check result");
    return { ok: true, outcome: "error", notified: false };
  }

  if (args.outcome === "unchanged") {
    const { error } = await supabase
      .from("watches")
      .update({
        last_checked: now,
        last_success_at: now,
        updated_at: now,
        check_status: "ok",
        last_error: null,
        last_error_code: null,
        consecutive_failures: 0,
        locked_at: null,
        locked_by: null,
      })
      .eq("id", args.watchId);
    if (error) throw new MonitorError("db", "Could not save check result");
    return { ok: true, outcome: "unchanged", notified: false };
  }

  const { error } = await supabase
    .from("watches")
    .update({
      previous_value: args.oldValue ?? undefined,
      current_value: args.newValue ?? null,
      last_checked: now,
      last_success_at: now,
      updated_at: now,
      baseline_pending: false,
      check_status: args.outcome === "baseline" ? "ok" : "changed",
      last_error: null,
      last_error_code: null,
      consecutive_failures: 0,
      locked_at: null,
      locked_by: null,
    })
    .eq("id", args.watchId);
  if (error) throw new MonitorError("db", "Could not save check result");

  let notified = false;
  if (
    args.outcome === "changed" &&
    args.notify !== false &&
    args.title &&
    args.body &&
    args.userId
  ) {
    const insertRow: Record<string, unknown> = {
      user_id: args.userId,
      watch_id: args.watchId,
      title: args.title,
      body: args.body,
      old_value: args.oldValue ?? null,
      new_value: args.newValue ?? null,
      read: false,
    };
    if (args.dedupeKey) insertRow.dedupe_key = args.dedupeKey;

    const { error: notifyErr } = await supabase.from("notifications").insert(insertRow);
    notified = !notifyErr;
    if (notifyErr) {
      const isDupe =
        notifyErr.code === "23505" ||
        notifyErr.message.toLowerCase().includes("duplicate") ||
        notifyErr.message.toLowerCase().includes("unique");
      if (!isDupe) {
        console.warn("Legacy notification insert failed:", notifyErr.message);
      }
    }
  }

  return { ok: true, outcome: args.outcome, notified };
}

export async function checkWatch(watch: WatchRow): Promise<CheckResult> {
  if (watch.paused) {
    return { watchId: watch.id, status: "skipped", reason: "paused" };
  }

  const pageMode = isPageWatch(watch);
  const hasSelector = Boolean(watch.selector?.trim());
  const hasText = Boolean(watch.element_text?.trim());

  if (!pageMode && !hasSelector && !hasText) {
    return { watchId: watch.id, status: "skipped", reason: "no selector" };
  }

  const supabase = createServiceClient();

  try {
    const html = await fetchPageHtml(watch.url);
    const quality = scoreFetchedHtml(html);

    if (quality === "empty_html" || quality === "js_shell") {
      await applyResult(supabase, {
        watchId: watch.id,
        outcome: "error",
        errorCode: quality,
        errorMessage:
          quality === "js_shell"
            ? "Page looks like a JavaScript shell without useful HTML content"
            : "Fetched HTML was empty or unusable",
      });
      return {
        watchId: watch.id,
        status: "error",
        code: quality,
        message:
          quality === "js_shell"
            ? "JavaScript-rendered page not available via fetch"
            : "Empty or unusable HTML",
      };
    }

    let extracted: string | null = null;
    let baselineOnly = false;

    if (pageMode) {
      extracted = pageFingerprint(html);
      baselineOnly = Boolean(watch.baseline_pending) || !watch.current_value?.trim();
    } else if (!hasSelector && hasText) {
      const needle = watch.element_text!.trim();
      extracted = pageContainsText(html, needle) ? needle : "Not found on page";
    } else {
      extracted = extractValue(html, watch.selector, watch.element_text);
    }

    if (!extracted) {
      await applyResult(supabase, {
        watchId: watch.id,
        outcome: "error",
        errorCode: "selector_missing",
        errorMessage: "Element not found on page",
      });
      return {
        watchId: watch.id,
        status: "error",
        code: "selector_missing",
        message: "Element not found on page",
      };
    }

    if (baselineOnly) {
      await applyResult(supabase, {
        watchId: watch.id,
        outcome: "baseline",
        newValue: extracted,
      });
      return { watchId: watch.id, status: "baseline" };
    }

    const compareMode = pageMode ? "page" : watch.mode;
    const changed = !valuesEqual(watch.current_value, extracted, compareMode);

    if (!changed) {
      await applyResult(supabase, {
        watchId: watch.id,
        outcome: "unchanged",
      });
      return { watchId: watch.id, status: "unchanged" };
    }

    const { title, body } = changeSummary(compareMode, watch.current_value, extracted);

    const key = dedupeKey(watch.id, watch.current_value, extracted);
    const applied = await applyResult(supabase, {
      watchId: watch.id,
      outcome: "changed",
      newValue: extracted,
      notify: watch.notify !== false,
      title: `${title} · ${watch.label}`,
      body,
      dedupeKey: key,
      userId: watch.user_id,
      oldValue: watch.current_value,
    });

    if (applied?.notified) {
      try {
        await sendPushToUser(watch.user_id, {
          title: `${title} · ${watch.label}`,
          body,
          url: `/watch/${watch.id}`,
        });
      } catch (pushErr) {
        console.warn("Push notification failed:", pushErr);
      }

      try {
        const { data: authData } = await supabase.auth.admin.getUserById(watch.user_id);
        const toEmail = authData.user?.email;
        if (toEmail) {
          await sendImmediateChangeEmail({
            userId: watch.user_id,
            toEmail,
            watchLabel: watch.label,
            title,
            body,
          });
        }
      } catch (mailErr) {
        console.warn("Immediate email failed:", mailErr);
      }
    }

    return {
      watchId: watch.id,
      status: "changed",
      oldValue: watch.current_value,
      newValue: extracted,
      notified: Boolean(applied?.notified),
    };
  } catch (error) {
    const monitored = toMonitorError(error);
    try {
      await applyResult(supabase, {
        watchId: watch.id,
        outcome: "error",
        errorCode: monitored.code,
        errorMessage: monitored.message,
      });
    } catch (applyErr) {
      console.error("Failed to persist watch error state:", applyErr);
    }

    return {
      watchId: watch.id,
      status: "error",
      code: monitored.code,
      message: monitored.message,
    };
  }
}

export async function runDueWatchChecks(
  limit = 25,
  options?: { force?: boolean },
): Promise<{
  checked: number;
  changed: number;
  errors: number;
  skipped: number;
  baselines: number;
  results: CheckResult[];
}> {
  const supabase = createServiceClient();
  const worker = `rinja-${Date.now().toString(36)}`;

  const { data, error } = await supabase.rpc("claim_due_watches", {
    p_limit: limit,
    p_worker: worker,
    p_lease_seconds: 120,
    p_force: Boolean(options?.force),
  });

  if (error) {
    // Fallback if migration not applied yet — keeps local/dev from hard-crashing.
    console.warn("claim_due_watches unavailable, falling back to unlocked scan:", error.message);
    return runDueWatchChecksFallback(limit, options);
  }

  const watches = (data ?? []) as WatchRow[];
  const results: CheckResult[] = [];

  for (const watch of watches) {
    results.push(await checkWatch(watch));
  }

  return {
    checked: watches.length,
    changed: results.filter((r) => r.status === "changed").length,
    errors: results.filter((r) => r.status === "error").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    baselines: results.filter((r) => r.status === "baseline").length,
    results,
  };
}

/** Legacy path without advisory locks — only if RPC missing. */
async function runDueWatchChecksFallback(
  limit = 25,
  options?: { force?: boolean },
): Promise<{
  checked: number;
  changed: number;
  errors: number;
  skipped: number;
  baselines: number;
  results: CheckResult[];
}> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("watches")
    .select("*")
    .eq("paused", false)
    .order("last_checked", { ascending: true, nullsFirst: true })
    .limit(100);

  if (error) throw error;

  const watches = (data ?? []) as WatchRow[];
  const due = watches
    .filter((w) => (options?.force ? true : isWatchDue(w.last_checked, w.created_at, w.frequency)))
    .slice(0, limit);

  const results: CheckResult[] = [];
  for (const watch of due) {
    results.push(await checkWatch(watch));
  }

  return {
    checked: due.length,
    changed: results.filter((r) => r.status === "changed").length,
    errors: results.filter((r) => r.status === "error").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    baselines: results.filter((r) => r.status === "baseline").length,
    results,
  };
}

export type MonitorRunSummary = {
  checked: number;
  changed: number;
  errors: number;
  skipped: number;
  baselines: number;
  results: CheckResult[];
};

/** User-scoped due checks — used while the app is open (no cron secret). */
export async function runDueWatchChecksForUser(
  userId: string,
  limit = 10,
  options?: { force?: boolean },
): Promise<MonitorRunSummary> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("watches")
    .select("*")
    .eq("user_id", userId)
    .eq("paused", false)
    .order("last_checked", { ascending: true, nullsFirst: true })
    .limit(50);

  if (error) throw error;

  const watches = (data ?? []) as WatchRow[];
  const due = watches
    .filter((w) => (options?.force ? true : isWatchDue(w.last_checked, w.created_at, w.frequency)))
    .slice(0, limit);

  const results: CheckResult[] = [];
  for (const watch of due) {
    results.push(await checkWatch(watch));
  }

  return {
    checked: due.length,
    changed: results.filter((r) => r.status === "changed").length,
    errors: results.filter((r) => r.status === "error").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    baselines: results.filter((r) => r.status === "baseline").length,
    results,
  };
}

/** Force-check one of the user's watches (e.g. when opening detail). */
export async function checkWatchForUser(userId: string, watchId: string): Promise<CheckResult> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("watches")
    .select("*")
    .eq("id", watchId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    return {
      watchId,
      status: "error",
      code: "unknown",
      message: "Watch not found",
    };
  }

  const watch = data as WatchRow;
  if (watch.paused) {
    return { watchId, status: "skipped", reason: "paused" };
  }

  return checkWatch(watch);
}
