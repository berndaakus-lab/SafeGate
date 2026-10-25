import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import AddStaffForm from "./AddStaffForm";
import ResetStaffPassword from "./ResetStaffPassword";
import Link from "next/link";
import { ScanLine, ShieldCheck, Upload, UserPlus, UserCheck } from "lucide-react";
import { Badge, EmptyState, InfoNote, PageHeader, Section, btnPrimary, btnSecondary } from "@/components/ui";

const ROLE_BADGE: Record<string, { tone: "blue" | "green" | "purple" | "slate"; label: string }> = {
  admin: { tone: "blue", label: "Admin" },
  guard: { tone: "green", label: "Guard" },
  teacher: { tone: "purple", label: "Teacher" },
};

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;

  const { data: staffList } = await supabaseAdmin
    .from("staff")
    .select("id, name, email, login_phone, role")
    .eq("school_id", schoolId)
    .order("name");

  const list = staffList ?? [];
  const count = (role: string) => list.filter((s: any) => s.role === role).length;

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader
        title="Staff Accounts"
        subtitle="Guards and on-duty teachers can scan pickup QR codes. Admins manage the school."
        actions={
          <>
            <a href="#add-staff" className={btnPrimary}>
              <UserPlus className="w-4 h-4" /> Add staff
            </a>
            <Link href="/admin/import?type=staff" className={btnSecondary}>
              <Upload className="w-4 h-4" /> Import many
            </Link>
          </>
        }
      />

      {list.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge tone="blue">{count("admin")} admin{count("admin") === 1 ? "" : "s"}</Badge>
          <Badge tone="green">{count("guard")} guard{count("guard") === 1 ? "" : "s"}</Badge>
          <Badge tone="purple">{count("teacher")} teacher{count("teacher") === 1 ? "" : "s"}</Badge>
        </div>
      )}

      {list.length === 0 ? (
        <div className="mb-8">
          <EmptyState
            icon={UserCheck}
            title="No staff yet"
            text="Add the guards and teachers who will scan pickup QR codes at the gate."
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="divide-y divide-slate-100">
            {list.map((staff: any) => {
              const role = ROLE_BADGE[staff.role] ?? { tone: "slate" as const, label: staff.role };
              return (
                <div key={staff.id} className="px-5 sm:px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700 shrink-0">
                      {staff.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{staff.name}</p>
                      <p className="text-sm text-slate-600 break-words">
                        {[staff.email, staff.login_phone].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <Badge tone={role.tone}>
                      {staff.role === "admin" ? <ShieldCheck className="w-3 h-3" /> : <ScanLine className="w-3 h-3" />}
                      {role.label}
                    </Badge>
                  </div>
                  {staff.role !== "admin" && <ResetStaffPassword staffId={staff.id} staffName={staff.name} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Section
        id="add-staff"
        icon={UserPlus}
        title="Add a staff member"
        hint="Security guards, or teachers who help at the gate when on duty. Both can scan pickup QR codes."
      >
        <AddStaffForm schoolId={schoolId} />
        <div className="mt-5">
          <InfoNote>Need another admin? Admins can only be added by the VerifyGate team, so ask us and we&apos;ll set them up.</InfoNote>
        </div>
      </Section>
    </div>
  );
}
