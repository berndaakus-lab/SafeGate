import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { GraduationCap, UserCircle, Info } from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function ChildrenPage() {
  const session = await getServerSession(authOptions);
  const parentId = (session?.user as any)?.id;

  const { data: children } = await supabaseAdmin
    .from("students")
    .select("id, name, class_name, photo_url")
    .eq("parent_id", parentId)
    .order("name");

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Children</h1>
        <p className="text-slate-500 mt-1">Children registered under your account by the school.</p>
      </div>

      {children && children.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6">
          <div className="divide-y divide-slate-50">
            {children.map((child: any) => (
              <div key={child.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-blue-100 flex items-center justify-center">
                  {child.photo_url ? (
                    <Image
                      src={child.photo_url}
                      alt={child.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-7 h-7 text-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{child.name}</p>
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
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center mb-6">
          <UserCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700 mb-1">No children added yet</p>
          <p className="text-sm text-slate-400">
            Your school admin will add your children to your account. They will appear here automatically once added.
          </p>
        </div>
      )}

      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 leading-relaxed">
          Children are added to your account by the school administrator. If a child is missing, please contact your school office.
        </p>
      </div>
    </div>
  );
}
