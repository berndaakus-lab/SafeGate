import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { GraduationCap, UserCircle } from "lucide-react";
import Image from "next/image";
import { EmptyState, InfoNote, PageHeader } from "@/components/ui";

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
      <PageHeader title="My Children" subtitle="Children registered under your account by the school." />

      {children && children.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {children.map((child: any) => (
            <div key={child.id} className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
              <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-blue-100 flex items-center justify-center">
                {child.photo_url ? (
                  <Image src={child.photo_url} alt={child.name} width={56} height={56} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-8 h-8 text-blue-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-base">{child.name}</p>
                {child.class_name && (
                  <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-0.5">
                    <GraduationCap className="w-4 h-4 text-slate-500" />
                    {child.class_name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-6">
          <EmptyState
            icon={UserCircle}
            title="No children added yet"
            text="Your school adds children to your account. They'll appear here automatically once added."
          />
        </div>
      )}

      <InfoNote>
        Children are added by the school. If a child is missing or a detail is wrong, please contact your school office.
      </InfoNote>
    </div>
  );
}
