import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import SessionProvider from "@/components/SessionProvider";
import SuperAdminNav from "@/components/SuperAdminNav";
import { scheduleBackgroundJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?reason=signin&for=superadmin");
  if ((session.user as any)?.role !== "superadmin") {
    redirect(`/login?reason=role&for=superadmin&as=${(session.user as any)?.role}`);
  }
  scheduleBackgroundJobs();

  const { count: newLeads } = await supabaseAdmin
    .from("demo_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-slate-50">
        <SuperAdminNav newLeads={newLeads ?? 0} />
        <main className="md:ml-64 pb-24 md:pb-0">{children}</main>
      </div>
    </SessionProvider>
  );
}
