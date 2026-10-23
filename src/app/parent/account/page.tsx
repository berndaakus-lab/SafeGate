import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import EditNameForm from "./EditNameForm";
import { KeyRound, School, UserRound } from "lucide-react";
import { Badge, PageHeader, Section } from "@/components/ui";

export default async function ParentAccountPage() {
  const session = await getServerSession(authOptions);
  const loginId = session?.user?.email || (session?.user as any)?.loginPhone;
  const schoolName = (session?.user as any)?.schoolName;

  return (
    <div className="p-6 max-w-lg">
      <PageHeader title="My Account" subtitle="Your details and password." />

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-2xl shrink-0">
            {session?.user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-lg">{session?.user?.name}</p>
            {loginId && <p className="text-slate-600 text-sm break-all">Signs in with {loginId}</p>}
            {schoolName && (
              <div className="mt-2">
                <Badge tone="blue"><School className="w-3 h-3" /> {schoolName}</Badge>
              </div>
            )}
          </div>
        </div>
      </section>

      <Section icon={UserRound} title="Your name" hint="Make sure this is your full name." className="mb-6">
        <EditNameForm name={session?.user?.name ?? ""} />
      </Section>

      <Section icon={KeyRound} title="Change password" hint="Use at least 8 characters, and one you haven't used before.">
        <ChangePasswordForm />
      </Section>
    </div>
  );
}
