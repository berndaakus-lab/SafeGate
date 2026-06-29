import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import AddChildForm from "./AddChildForm";
import { GraduationCap, UserCircle } from "lucide-react";

export default async function ChildrenPage() {
  const session = await getServerSession(authOptions);
  const parentId = (session?.user as any)?.id;
  const schoolId = (session?.user as any)?.schoolId;

  const { data: children } = await supabaseAdmin
    .from("students")
    .select("*")
    .eq("parent_id", parentId)
    .order("name");

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Children</h1>
        <p className="text-slate-500 mt-1">Manage the children registered under your account.</p>
      </div>

      {children && children.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6">
          <div className="divide-y divide-slate-50">
            {children.map((child: any) => (
              <div key={child.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{child.name}</p>
                  {child.class_name && (
                    <p className="text-sm text-slate-400 flex items-center gap-1 mt-0.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {child.class_name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Add a Child</h2>
        <AddChildForm parentId={parentId} schoolId={schoolId} />
      </div>
    </div>
  );
}
