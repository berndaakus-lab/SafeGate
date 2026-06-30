import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import AddParentForm from "./AddParentForm";
import AddChildInline from "./AddChildInline";
import EditParentModal from "./EditParentModal";
import { GraduationCap, UserPlus } from "lucide-react";

export default async function ParentsPage() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;

  const { data: parents } = await supabaseAdmin
    .from("parents")
    .select("id, name, email, phone, students(id, name, class_name)")
    .eq("school_id", schoolId)
    .order("name");

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Parents & Students</h1>
        <p className="text-slate-500 mt-1">
          Create parent accounts and add their children. Set everything up before the parent logs in.
        </p>
      </div>

      {parents && parents.length > 0 && (
        <div className="space-y-4 mb-8">
          {parents.map((parent: any) => (
            <div key={parent.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              {/* Parent row */}
              <div className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-700 shrink-0">
                  {parent.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{parent.name}</p>
                    <EditParentModal parent={parent} />
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {parent.email}{parent.phone ? ` · ${parent.phone}` : ""}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                  parent.students?.length > 0
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-600"
                }`}>
                  {parent.students?.length ?? 0} child{parent.students?.length !== 1 ? "ren" : ""}
                </span>
              </div>

              {/* Children list */}
              {parent.students && parent.students.length > 0 && (
                <div className="px-6 pb-3 flex flex-wrap gap-2 pl-20">
                  {parent.students.map((s: any) => (
                    <span key={s.id} className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                      <GraduationCap className="w-3 h-3" />
                      {s.name}{s.class_name ? ` · ${s.class_name}` : ""}
                    </span>
                  ))}
                </div>
              )}

              {/* Add child inline */}
              <div className="border-t border-slate-50 px-6 py-4 bg-slate-50/50">
                <AddChildInline
                  parentId={parent.id}
                  schoolId={schoolId}
                  parentName={parent.name}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add parent form */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-blue-600" />
          Add Parent Account
        </h2>
        <p className="text-sm text-slate-400 mb-5">
          Create a login for the parent. Add their children right after.
        </p>
        <AddParentForm schoolId={schoolId} />
      </div>
    </div>
  );
}
