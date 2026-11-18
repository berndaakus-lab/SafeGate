import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import SessionProvider from "@/components/SessionProvider";
import AdminNav from "@/components/AdminNav";
import SchoolBanner from "@/components/SchoolBanner";
import RoleSwitchBar from "@/components/RoleSwitchBar";
import { scheduleBackgroundJobs } from "@/lib/jobs";
import { requirePasswordChanged } from "@/lib/force-password";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session) redirect("/login?reason=signin&for=admin");
  if (role !== "admin") {
    if (role === "guard" || role === "teacher") redirect("/guard/scan");
    redirect(`/login?reason=role&for=admin&as=${role}`);
  }

  // Every admin page reads this school's data; a sign-in without the school
  // would show empty pages, so ask for a fresh sign-in instead
  const schoolId = (session.user as any)?.schoolId;
  if (!schoolId) redirect("/login?reason=signin&for=admin");

  await requirePasswordChanged(session);
  scheduleBackgroundJobs();

  const { data: school } = await supabaseAdmin
    .from("schools")
    .select("is_active, logo_url")
    .eq("id", schoolId)
    .single();

  if (school && school.is_active === false) {
    redirect("/offline");
  }
  const logoUrl: string | null = school?.logo_url ?? null;

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-slate-50">
        <AdminNav schoolLogoUrl={logoUrl} />
        <main className="md:ml-64 pb-nav md:pb-0">
          <RoleSwitchBar />
          <SchoolBanner name={(session.user as any)?.schoolName} logoUrl={logoUrl} />
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
