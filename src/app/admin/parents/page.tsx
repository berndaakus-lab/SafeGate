import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import AddParentForm from "./AddParentForm";
import AddChildInline from "./AddChildInline";
import EditParentModal from "./EditParentModal";
import Link from "next/link";
import { GraduationCap, Upload, UserPlus, Users, MessageSquareOff } from "lucide-react";
import { Badge, EmptyState, InfoNote, PageHeader, Section, btnPrimary, btnSecondary } from "@/components/ui";

export default async function ParentsPage() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;

  const { data: parents } = await supabaseAdmin
    .from("parents")
    .select("id, name, email, login_phone, phone, students(id, name, class_name)")
    .eq("school_id", schoolId)
    .order("name");

  const list = parents ?? [];
  const childCount = list.reduce((n: number, p: any) => n + (p.students?.length ?? 0), 0);
  const noSms = list.filter((p: any) => !p.phone).length;

  return (
    <div className="p-6 max-w-3xl">
      <PageHeader
        title="Parents & Students"
        subtitle="Create parent accounts and add their children. Set everything up before the parent logs in."
        actions={
          <>
            <a href="#add-parent" className={btnPrimary}>
              <UserPlus className="w-4 h-4" /> Add parent
            </a>
            <Link href="/admin/import" className={btnSecondary}>
              <Upload className="w-4 h-4" /> Import many
            </Link>
          </>
        }
      />

      {list.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge tone="blue">{list.length} parent{list.length === 1 ? "" : "s"}</Badge>
          <Badge tone="green">{childCount} child{childCount === 1 ? "" : "ren"}</Badge>
          {noSms > 0 && <Badge tone="red">{noSms} without an SMS number</Badge>}
        </div>
      )}

      {noSms > 0 && (
        <div className="mb-6">
          <InfoNote tone="amber">
            Parents without an SMS number only get pickup alerts if they have enabled app notifications. Use <strong>Edit</strong> to add one.
          </InfoNote>
        </div>
      )}

      {list.length === 0 ? (
        <div className="mb-8">
          <EmptyState
            icon={Users}
            title="No parents yet"
            text="Add parents one at a time below, or import your whole list from a spreadsheet."
            action={
              <Link href="/admin/import" className={btnSecondary}>
                <Upload className="w-4 h-4" /> Import from a spreadsheet
              </Link>
            }
          />
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {list.map((parent: any) => {
            const kids = parent.students ?? [];
            return (
              <div key={parent.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-start gap-4 px-5 sm:px-6 py-4">
                  <div className="w-11 h-11 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-700 shrink-0">
                    {parent.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-base">{parent.name}</p>
                    <p className="text-sm text-slate-600 break-words">
                      {[parent.email, parent.login_phone].filter(Boolean).join(" · ")}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge tone={kids.length ? "green" : "amber"}>
                        {kids.length} child{kids.length === 1 ? "" : "ren"}
                      </Badge>
                      {parent.phone ? (
                        <Badge tone="slate">SMS {parent.phone}</Badge>
                      ) : (
                        <Badge tone="red"><MessageSquareOff className="w-3 h-3" /> No SMS number</Badge>
                      )}
                    </div>
                  </div>
                  <EditParentModal parent={parent} />
                </div>

                {kids.length > 0 && (
                  <div className="px-5 sm:px-6 pb-4 flex flex-wrap gap-2 sm:pl-20">
                    {kids.map((s: any) => (
                      <span key={s.id} className="inline-flex items-center gap-1.5 text-sm bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full">
                        <GraduationCap className="w-4 h-4 text-slate-500" />
                        {s.name}{s.class_name ? ` · ${s.class_name}` : ""}
                      </span>
                    ))}
                  </div>
                )}

                <div className="border-t border-slate-100 px-5 sm:px-6 py-3 bg-slate-50/60">
                  <AddChildInline parentId={parent.id} schoolId={schoolId} parentName={parent.name} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Section
        id="add-parent"
        icon={UserPlus}
        title="Add a parent"
        hint="Create a login for the parent, then add their children from their card above."
      >
        <AddParentForm schoolId={schoolId} />
      </Section>
    </div>
  );
}
