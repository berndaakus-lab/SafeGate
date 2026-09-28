import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import AddStaffForm from "./AddStaffForm";
import { Shield, UserCheck } from "lucide-react";

const roleColors: Record<string, string> = {
  admin: "bg-blue-100 text-blue-700",
  guard: "bg-green-100 text-green-700",
  teacher: "bg-purple-100 text-purple-700",
};

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;

  const { data: staffList } = await supabaseAdmin
    .from("staff")
    .select("id, name, email, login_phone, role")
    .eq("school_id", schoolId)
    .order("name");

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Staff Accounts</h1>
        <p className="text-slate-500 mt-1">Manage admin, guard and teacher accounts for your school.</p>
      </div>

      {staffList && staffList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6">
          <div className="divide-y divide-slate-50">
            {staffList.map((staff: any) => (
              <div key={staff.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                  {staff.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{staff.name}</p>
                  <p className="text-xs text-slate-400 truncate">{[staff.email, staff.login_phone].filter(Boolean).join(" · ")}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${roleColors[staff.role] ?? "bg-slate-100 text-slate-600"}`}>
                  {staff.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-900 mb-1">Add Staff Member</h2>
        <p className="text-sm text-slate-400 mb-5">
          Create accounts for security guards, or for teachers who help with pickup when on duty. Both can scan pickup QR codes.
        </p>
        <AddStaffForm schoolId={schoolId} />
      </div>
    </div>
  );
}
