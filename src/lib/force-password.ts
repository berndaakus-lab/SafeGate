import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { supabaseAdmin } from "@/lib/supabase";

// Read from the DB (not the JWT) so a reset by an admin takes effect
// immediately and clearing the flag needs no session refresh.
export async function requirePasswordChanged(session: Session) {
  const user = session.user as any;
  if (!user?.id || user.role === "superadmin") return;
  const table = user.role === "parent" ? "parents" : "staff";
  const { data } = await supabaseAdmin.from(table).select("must_change_password").eq("id", user.id).maybeSingle();
  if (data?.must_change_password) redirect("/change-password");
}
