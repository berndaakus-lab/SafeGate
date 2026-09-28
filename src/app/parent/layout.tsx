import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ParentNav from "@/components/ParentNav";
import SessionProvider from "@/components/SessionProvider";
import PushSubscriber from "@/components/PushSubscriber";
import { supabaseAdmin } from "@/lib/supabase";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?reason=signin&for=parent");
  if ((session.user as any)?.role !== "parent") {
    redirect(`/login?reason=role&for=parent&as=${(session.user as any)?.role}`);
  }

  const schoolId = (session.user as any)?.schoolId;
  const { data: school } = schoolId
    ? await supabaseAdmin.from("schools").select("logo_url").eq("id", schoolId).maybeSingle()
    : { data: null };

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-slate-50">
        <PushSubscriber />
        <ParentNav schoolLogoUrl={school?.logo_url ?? null} />
        <main className="md:ml-64 pb-24 md:pb-0">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
