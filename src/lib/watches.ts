import { supabase } from "./supabase";

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
  mode: string;
  frequency: string;
};

export type UpdateWatchSelectionInput = {
  label: string;
  currentValue: string;
  selector: string;
  elementText: string;
  elementTag: string;
  elementHtml: string;
  mode: string;
};

export type DatabaseWatch = {
  id: string;
  user_id: string;
  url: string;
  host: string | null;
  title: string | null;
  label: string;
  current_value: string | null;
  selector: string | null;
  element_text: string | null;
  element_tag: string | null;
  element_html: string | null;
  mode: string | null;
  frequency: string | null;
  paused: boolean;
  created_at: string;
  updated_at: string | null;
  last_checked: string | null;
};

async function requireUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("You must be signed in.");

  return user;
}

export async function createWatch(
  input: CreateWatchInput,
): Promise<DatabaseWatch> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("watches")
    .insert({
      user_id: user.id,
      url: input.url,
      host: input.host,
      title: input.title,
      label: input.label,
      current_value: input.currentValue,
      selector: input.selector,
      element_text: input.elementText,
      element_tag: input.elementTag,
      element_html: input.elementHtml,
      mode: input.mode,
      frequency: input.frequency,
      paused: false,
    })
    .select()
    .single();

  if (error) throw error;

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

export async function getWatchById(
  id: string,
): Promise<DatabaseWatch | null> {
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;

  return data as DatabaseWatch;
}

export async function setWatchPaused(
  id: string,
  paused: boolean,
): Promise<DatabaseWatch> {
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

  const { error } = await supabase
    .from("watches")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}