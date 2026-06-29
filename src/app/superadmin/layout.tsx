import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SessionProvider from "@/components/SessionProvider";
import SuperAdminNav from "@/components/SuperAdminNav";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "superadmin") {
    redirect("/login?role=superadmin");
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-slate-50">
        <SuperAdminNav />
        <main className="md:ml-64 pb-24 md:pb-0">{children}</main>
      </div>
    </SessionProvider>
  );
}
