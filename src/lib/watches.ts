import { requireUser } from "./auth";
import { userFacingError, type MonitorErrorCode } from "./monitoring/errors";
import { supabase } from "./supabase";
import type { WatchFrequency, WatchMode } from "./watch-mode";

export type CreateWatchInput = {
  url: string;
  host: string;
  title: string;
  label: string;
  currentValue: string;
  selector: string;
  elementText: string;
  elementTag: string;
  elementHtml: string;
  mode: WatchMode;
  frequency: WatchFrequency | string;
  notify?: boolean;
  /** Whole-page watches start without a fingerprint until the first check. */
  baselinePending?: boolean;
};

export type UpdateWatchSelectionInput = {
  label: string;
  currentValue: string;
  selector: string;
  elementText: string;
  elementTag: string;
  elementHtml: string;
  mode: WatchMode;
  notify?: boolean;
};

export type DatabaseWatch = {
  id: string;
  user_id: string;
  url: string;
  host: string | null;
  title: string | null;
  label: string;
  current_value: string | null;
  previous_value?: string | null;
  selector: string | null;
  element_text: string | null;
  element_tag: string | null;
  element_html: string | null;
  mode: WatchMode | string | null;
  frequency: WatchFrequency | string | null;
  paused: boolean;
  notify: boolean | null;
  created_at: string;
  updated_at: string | null;
  last_checked: string | null;
  last_attempted_at?: string | null;
  last_success_at?: string | null;
  last_error?: string | null;
  last_error_code?: string | null;
  consecutive_failures?: number | null;
  check_status?: string | null;
  baseline_pending?: boolean | null;
};

export async function createWatch(input: CreateWatchInput): Promise<DatabaseWatch> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("watches")
    .insert({
      user_id: user.id,
      url: input.url,
      host: input.host,
      title: input.title,
      label: input.label,
      // Empty string can violate some DB checks; null is fine for baseline page watches.
      current_value: input.currentValue.trim() ? input.currentValue : null,
      selector: input.selector,
      element_text: input.elementText,
      element_tag: input.elementTag,
      element_html: input.elementHtml,
      mode: input.mode,
      frequency: input.frequency,
      notify: input.notify ?? true,
      paused: false,
      ...(input.baselinePending ? { baseline_pending: true } : {}),
    })
    .select()
    .single();

  if (error) {
    console.error("createWatch failed:", error.message, error.code);
    throw new Error("Could not create watch. Please try again.");
  }

  return data as DatabaseWatch;
}

export async function getWatches(): Promise<DatabaseWatch[]> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("watches")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as DatabaseWatch[];
}

function isPageWatchRow(watch: DatabaseWatch): boolean {
  return watch.mode === "page" || watch.element_tag === "page";
}

function isPasteWatchRow(watch: DatabaseWatch): boolean {
  return !watch.selector?.trim() && Boolean(watch.element_text?.trim());
}

/** Badge label for watch detail (honest — not always “Live”). */
export function watchBadgeLabel(watch: DatabaseWatch): string {
  if (watch.paused) return "Paused";

  const status = watch.check_status ?? null;
  if (status === "error" || status === "blocked" || status === "unsupported") {
    return (watch.consecutive_failures ?? 0) >= 3 ? "Unstable" : "Issue";
  }

  if (
    watch.baseline_pending ||
    (isPageWatchRow(watch) && !watch.current_value?.trim()) ||
    status === "pending" ||
    !watch.last_checked
  ) {
    return "Pending";
  }

  if (status === "changed") return "Changed";

  return "Watching";
}

/** Short status line for home / lists. */
export function watchStatusLine(watch: DatabaseWatch): string {
  if (watch.paused) return "Paused";

  const status = watch.check_status ?? null;
  if (status === "error" || status === "blocked" || status === "unsupported") {
    const code = (watch.last_error_code ?? "unknown") as MonitorErrorCode;
    const base = userFacingError(code, watch.last_error ?? "Check failed");
    const fails = watch.consecutive_failures ?? 0;
    return fails > 1 ? `${base} (${fails} fails)` : base;
  }

  if (watch.baseline_pending || (isPageWatchRow(watch) && !watch.current_value?.trim())) {
    return "Baseline pending — first check soon";
  }

  if (isPageWatchRow(watch)) {
    return status === "changed" ? "Page changed" : "Watching whole page";
  }

  if (isPasteWatchRow(watch)) {
    if (watch.current_value === "Not found on page") {
      return status === "changed" ? "Changed — text missing on page" : "Text missing on page";
    }
    const snippet = watch.element_text!.trim().slice(0, 36);
    const watching = `Watching “${snippet}${watch.element_text!.trim().length > 36 ? "…" : ""}”`;
    return status === "changed" ? `Changed — ${watching}` : watching;
  }

  if (status === "changed") {
    const value = watch.current_value?.trim();
    return value ? `Changed — ${value}` : "Changed";
  }

  return watch.current_value?.trim() || "Watching";
}

const FREQ_MS: Record<string, number> = {
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
};

/** Human-readable next-check hint for detail UI. */
export function watchNextCheckLabel(watch: DatabaseWatch): string {
  if (watch.paused) return "Paused";
  if (watch.baseline_pending || !watch.last_checked) {
    return "Soon (first check)";
  }

  const interval = FREQ_MS[watch.frequency ?? "15m"] ?? FREQ_MS["15m"];
  const next = new Date(watch.last_checked).getTime() + interval;
  if (Number.isNaN(next)) return "Soon";

  const delta = next - Date.now();
  if (delta <= 0) return "Due now";

  const mins = Math.round(delta / 60_000);
  if (mins < 60) return `In ~${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `In ~${hours}h`;
  return `In ~${Math.round(hours / 24)}d`;
}

export function watchHealthMessage(watch: DatabaseWatch): string | null {
  if (watch.paused) return null;
  const status = watch.check_status;
  if (status !== "error" && status !== "blocked" && status !== "unsupported") {
    return null;
  }
  const code = (watch.last_error_code ?? "unknown") as MonitorErrorCode;
  return userFacingError(code, watch.last_error ?? "Check failed");
}

export async function getWatchById(id: string): Promise<DatabaseWatch | null> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("watches")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load watch:", error);
    throw error;
  }

  return data as DatabaseWatch | null;
}

export async function updateWatchSelection(
  id: string,
  input: UpdateWatchSelectionInput,
): Promise<DatabaseWatch> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("watches")
    .update({
      label: input.label,
      current_value: input.currentValue,
      selector: input.selector,
      element_text: input.elementText,
      element_tag: input.elementTag,
      element_html: input.elementHtml,
      mode: input.mode,
      ...(typeof input.notify === "boolean" ? { notify: input.notify } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;

  return data as DatabaseWatch;
}

export async function setWatchLabel(id: string, label: string): Promise<DatabaseWatch> {
  const user = await requireUser();
  const trimmed = label.replace(/\s+/g, " ").trim();
  if (!trimmed) throw new Error("Name can’t be empty");

  const { data, error } = await supabase
    .from("watches")
    .update({
      label: trimmed.slice(0, 80),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;

  return data as DatabaseWatch;
}

export async function setWatchNotify(id: string, notify: boolean): Promise<DatabaseWatch> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("watches")
    .update({
      notify,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;

  return data as DatabaseWatch;
}

export async function setWatchPaused(id: string, paused: boolean): Promise<DatabaseWatch> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("watches")
    .update({
      paused,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;

  return data as DatabaseWatch;
}

export async function deleteWatch(id: string): Promise<void> {
  const user = await requireUser();

  const { error } = await supabase.from("watches").delete().eq("id", id).eq("user_id", user.id);

  if (error) throw error;
}
