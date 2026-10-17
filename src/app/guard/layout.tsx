import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SessionProvider from "@/components/SessionProvider";
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
  if (schoolId) {
    const { data: school } = await supabaseAdmin.from("schools").select("is_active").eq("id", schoolId).maybeSingle();
    if (school?.is_active === false) redirect("/offline");
  }

  return <SessionProvider session={session}>{children}</SessionProvider>;
}
