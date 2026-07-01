import { supabaseAdmin } from "./supabase";
import { unstable_noStore as noStore } from "next/cache";

export type Settings = Record<string, string>;

export async function getSettings(): Promise<Settings> {
  noStore(); // never cache — always fetch fresh from DB
  const { data } = await supabaseAdmin.from("settings").select("key, value");
  if (!data) return {};
  return Object.fromEntries(data.map((r: any) => [r.key, r.value]));
}

export function s(settings: Settings, key: string, fallback = ""): string {
  return settings[key] ?? fallback;
}
