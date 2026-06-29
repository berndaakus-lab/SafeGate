import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import AddParentForm from "./AddParentForm";
import { Users, GraduationCap } from "lucide-react";

export default async function ParentsPage() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;

  const { data: parents } = await supabaseAdmin
    .from("parents")
    .select("id, name, email, phone, students(name, class_name)")
    .eq("school_id", schoolId)
    .order("name");

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Parents</h1>
        <p className="text-slate-500 mt-1">Create parent accounts and manage their children.</p>
      </div>

      {parents && parents.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6">
          <div className="divide-y divide-slate-50">
            {parents.map((parent: any) => (
              <div key={parent.id} className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-700">
                    {parent.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{parent.name}</p>
                    <p className="text-xs text-slate-400">{parent.email}{parent.phone ? ` · ${parent.phone}` : ""}</p>
                  </div>
                  <span className="text-xs text-slate-400">{parent.students?.length ?? 0} child(ren)</span>
                </div>
                {parent.students && parent.students.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 pl-14">
                    {parent.students.map((s: any) => (
                      <span key={s.name} className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                        <GraduationCap className="w-3 h-3" /> {s.name}{s.class_name ? ` · ${s.class_name}` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-900 mb-1">Add Parent Account</h2>
        <p className="text-sm text-slate-400 mb-5">
          Create a login for the parent. They will use it to generate pickup QR codes.
        </p>
        <AddParentForm schoolId={schoolId} />
      </div>
    </div>
  );
}
