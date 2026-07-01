import { supabaseAdmin } from "./supabase";

export type Settings = Record<string, string>;

export async function getSettings(): Promise<Settings> {
  const { data } = await supabaseAdmin.from("settings").select("key, value");
  if (!data) return {};
  return Object.fromEntries(data.map((r: any) => [r.key, r.value]));
}

export function s(settings: Settings, key: string, fallback = ""): string {
  return settings[key] ?? fallback;
}
