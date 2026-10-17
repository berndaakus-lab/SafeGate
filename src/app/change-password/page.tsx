import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import FirstLoginForm from "./FirstLoginForm";

export const metadata = { title: "Set your password", robots: { index: false } };

const ROLE_HOME: Record<string, string> = {
  admin: "/admin/dashboard",
  parent: "/parent/dashboard",
  guard: "/guard/scan",
  teacher: "/guard/scan",
};

export default async function ChangePasswordPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  const home = ROLE_HOME[user.role];
  if (!home) redirect("/login");

  const table = user.role === "parent" ? "parents" : "staff";
  const { data } = await supabaseAdmin.from(table).select("must_change_password").eq("id", user.id).maybeSingle();
  if (!data?.must_change_password) redirect(home);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
          <ShieldCheck className="w-6 h-6 text-blue-700" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Set your own password</h1>
        <p className="text-slate-500 mt-2 mb-6">
          Welcome{user.name ? `, ${user.name.split(" ")[0]}` : ""}. Your account was created with a temporary password.
          Choose a new one that only you know before you continue.
        </p>
        <FirstLoginForm home={home} />
      </div>
    </main>
  );
}
