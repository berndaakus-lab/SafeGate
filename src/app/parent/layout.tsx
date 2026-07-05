import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ParentNav from "@/components/ParentNav";
import SessionProvider from "@/components/SessionProvider";
import PushSubscriber from "@/components/PushSubscriber";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "parent") {
    redirect("/login?role=parent");
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-slate-50">
        <PushSubscriber />
        <ParentNav />
        <main className="md:ml-64 pb-24 md:pb-0">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
