import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SessionProvider from "@/components/SessionProvider";
import SchoolBanner from "@/components/SchoolBanner";
import { supabaseAdmin } from "@/lib/supabase";
import { scheduleBackgroundJobs } from "@/lib/jobs";
import { requirePasswordChanged } from "@/lib/force-password";

export default async function GuardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  // Admins can scan and confirm pickups too (covering the gate); superadmins
  // can open the scanner but have no school, so cannot confirm.
  if (!session) redirect("/login?reason=signin&for=scanner");
  if (!["guard", "teacher", "admin", "superadmin"].includes(role)) {
    redirect(`/login?reason=role&for=scanner&as=${role}`);
  }

  await requirePasswordChanged(session);
  scheduleBackgroundJobs();

  const schoolId = (session.user as any)?.schoolId;
  let logoUrl: string | null = null;
  if (schoolId) {
    const { data: school } = await supabaseAdmin.from("schools").select("is_active, logo_url").eq("id", schoolId).maybeSingle();
    if (school?.is_active === false) redirect("/offline");
    logoUrl = school?.logo_url ?? null;
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen flex flex-col bg-slate-900">
        <SchoolBanner name={(session.user as any)?.schoolName} logoUrl={logoUrl} dark />
        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    </SessionProvider>
  );
}
