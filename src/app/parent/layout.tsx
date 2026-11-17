import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ParentNav from "@/components/ParentNav";
import SchoolBanner from "@/components/SchoolBanner";
import SessionProvider from "@/components/SessionProvider";
import PushSubscriber from "@/components/PushSubscriber";
import { supabaseAdmin } from "@/lib/supabase";
import { scheduleBackgroundJobs } from "@/lib/jobs";
import { requirePasswordChanged } from "@/lib/force-password";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?reason=signin&for=parent");
  if ((session.user as any)?.role !== "parent") {
    redirect(`/login?reason=role&for=parent&as=${(session.user as any)?.role}`);
  }

  // A sign-in without the school would show empty pages: ask for a fresh sign-in
  const schoolId = (session.user as any)?.schoolId;
  if (!schoolId) redirect("/login?reason=signin&for=parent");

  await requirePasswordChanged(session);
  scheduleBackgroundJobs();

  const { data: school } = await supabaseAdmin.from("schools").select("logo_url, is_active").eq("id", schoolId).maybeSingle();
  if (school?.is_active === false) redirect("/offline");

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-slate-50">
        <PushSubscriber />
        <ParentNav schoolLogoUrl={school?.logo_url ?? null} />
        <main className="md:ml-64 pb-nav md:pb-0">
          <SchoolBanner name={(session.user as any)?.schoolName} logoUrl={school?.logo_url ?? null} />
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
