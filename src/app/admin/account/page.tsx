import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { KeyRound } from "lucide-react";

export default async function AdminAccountPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  return (
    <div className="p-6 max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Account</h1>
        <p className="text-slate-500 mt-1">Manage your staff account settings.</p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl">
            {session?.user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-lg">{session?.user?.name}</p>
            <p className="text-slate-400 text-sm">{session?.user?.email || (session?.user as any)?.loginPhone}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{role}</span>
              <span className="text-xs text-slate-400">{(session?.user as any)?.schoolName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-slate-400" />
          Change Password
        </h2>
        <p className="text-sm text-slate-400 mb-5">
          Update your password. Share the new one only with yourself.
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
