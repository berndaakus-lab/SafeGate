import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import SessionProvider from "@/components/SessionProvider";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session) redirect("/login?reason=signin&for=admin");
  if (role !== "admin") {
    if (role === "guard" || role === "teacher") redirect("/guard/scan");
    redirect(`/login?reason=role&for=admin&as=${role}`);
  }

  const schoolId = (session.user as any)?.schoolId;
  let logoUrl: string | null = null;

  if (schoolId) {
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("is_active, logo_url")
      .eq("id", schoolId)
      .single();

    if (school && school.is_active === false) {
      redirect("/offline");
    }
    logoUrl = school?.logo_url ?? null;
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-slate-50">
        <AdminNav schoolLogoUrl={logoUrl} />
        <main className="md:ml-64 pb-24 md:pb-0">{children}</main>
      </div>
    </SessionProvider>
  );
}
