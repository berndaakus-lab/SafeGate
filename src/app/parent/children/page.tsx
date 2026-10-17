import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { GraduationCap, UserCircle } from "lucide-react";
import { EmptyState, InfoNote, PageHeader } from "@/components/ui";
import StudentPhotoButton from "@/components/StudentPhotoButton";
import ReportCorrectionButton from "./ReportCorrectionButton";

export const dynamic = "force-dynamic";

export default async function ChildrenPage() {
  const session = await getServerSession(authOptions);
  const parentId = (session?.user as any)?.id;

  const { data: children } = await supabaseAdmin
    .from("students")
    .select("id, name, class_name, photo_url")
    .eq("parent_id", parentId)
    .is("archived_at", null)
    .order("name");

  const missingPhotos = (children ?? []).filter((c: any) => !c.photo_url).length;

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader title="My Children" subtitle="Children registered under your account by the school." />

      {missingPhotos > 0 && (
        <div className="mb-4">
          <InfoNote tone="amber">
            Please add a clear photo of {missingPhotos === 1 ? "your child" : "each child"}. The guard at the gate sees it before letting
            your child leave, so it helps keep them safe.
          </InfoNote>
        </div>
      )}

      {children && children.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 mb-6">
          {children.map((child: any) => (
            <div key={child.id} className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-base">{child.name}</p>
                {child.class_name && (
                  <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-0.5">
                    <GraduationCap className="w-4 h-4 text-slate-500" />
                    {child.class_name}
                  </p>
                )}
                <ReportCorrectionButton studentId={child.id} name={child.name} />
              </div>
              <StudentPhotoButton
                studentId={child.id}
                name={child.name}
                photoUrl={child.photo_url ?? null}
                endpoint="/api/parent/student-photo"
              />
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
        Children are added by the school. If a name or class is wrong, use &quot;Wrong name or class?&quot; on the child&apos;s card.
        If a child is missing, please contact your school office. Use a recent, front-facing photo in good light.
      </InfoNote>
    </div>
  );
}
