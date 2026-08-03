import { changeSummary, valuesEqual } from "./compare";
import { extractValue, fetchPageHtml } from "./extract";
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
  selector: string | null;
  element_text: string | null;
  mode: WatchMode | string | null;
  frequency: WatchFrequency | string | null;
  paused: boolean;
  notify: boolean | null;
  created_at: string;
  last_checked: string | null;
};

export type CheckResult =
  | { watchId: string; status: "unchanged" }
  | {
      watchId: string;
      status: "changed";
      oldValue: string | null;
      newValue: string;
    }
  | { watchId: string; status: "error"; message: string }
  | { watchId: string; status: "skipped"; reason: string };

export async function checkWatch(watch: WatchRow): Promise<CheckResult> {
  if (watch.paused) {
    return { watchId: watch.id, status: "skipped", reason: "paused" };
  }

  if (!watch.selector?.trim() && !watch.element_text?.trim()) {
    return { watchId: watch.id, status: "skipped", reason: "no selector" };
  }

  try {
    const html = await fetchPageHtml(watch.url);
    const extracted = extractValue(
      html,
      watch.selector,
      watch.element_text,
    );

    const now = new Date().toISOString();
    const supabase = createServiceClient();

    if (!extracted) {
      const { error: missError } = await supabase
        .from("watches")
        .update({ last_checked: now, updated_at: now })
        .eq("id", watch.id);
      if (missError) {
        return {
          watchId: watch.id,
          status: "error",
          message: missError.message,
        };
      }

      return {
        watchId: watch.id,
        status: "error",
        message: "Element not found on page",
      };
    }

    const changed = !valuesEqual(
      watch.current_value,
      extracted,
      watch.mode,
    );

    if (!changed) {
      const { error: touchError } = await supabase
        .from("watches")
        .update({ last_checked: now, updated_at: now })
        .eq("id", watch.id);
      if (touchError) {
        return {
          watchId: watch.id,
          status: "error",
          message: touchError.message,
        };
      }

      return { watchId: watch.id, status: "unchanged" };
    }

    const { title, body } = changeSummary(
      watch.mode,
      watch.current_value,
      extracted,
    );

    const { error: updateError } = await supabase
      .from("watches")
      .update({
        current_value: extracted,
        last_checked: now,
        updated_at: now,
      })
      .eq("id", watch.id);
    if (updateError) {
      return {
        watchId: watch.id,
        status: "error",
        message: updateError.message,
      };
    }

    // Default true when column is missing/null (pre-migration rows).
    if (watch.notify !== false) {
      const { error: notifyError } = await supabase.from("notifications").insert({
        user_id: watch.user_id,
        watch_id: watch.id,
        title: `${title} · ${watch.label}`,
        body,
        old_value: watch.current_value,
        new_value: extracted,
        read: false,
      });
      if (notifyError) {
        return {
          watchId: watch.id,
          status: "error",
          message: notifyError.message,
        };
      }
    }

    return {
      watchId: watch.id,
      status: "changed",
      oldValue: watch.current_value,
      newValue: extracted,
    };
  } catch (error) {
    return {
      watchId: watch.id,
      status: "error",
      message: error instanceof Error ? error.message : "Check failed",
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
    .filter((w) =>
      options?.force
        ? true
        : isWatchDue(w.last_checked, w.created_at, w.frequency),
    )
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
    results,
  };
}
