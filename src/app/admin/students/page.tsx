import { getServerSession } from "next-auth";
import Link from "next/link";
import { GraduationCap, Upload, UserPlus } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getSchoolClasses } from "@/lib/school-classes";
import { InfoNote, PageHeader, Section, btnPrimary, btnSecondary } from "@/components/ui";
import StudentsList, { type StudentRow } from "./StudentsList";
import AddStudentForm from "./AddStudentForm";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId as string;

  const [{ data }, classes] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select("id, name, class_name, photo_url, parent_id, archived_at, parents(name)")
      .eq("school_id", schoolId)
      .order("name")
      .limit(5000),
    getSchoolClasses(schoolId),
  ]);

  const students: StudentRow[] = (data ?? []).map((s: any) => {
    const parent = Array.isArray(s.parents) ? s.parents[0] : s.parents;
    return {
      id: s.id,
      name: s.name,
      class_name: s.class_name,
      photo_url: s.photo_url,
      parent_id: s.parent_id,
      parentName: parent?.name ?? null,
      archived: !!s.archived_at,
    };
  });
  const levels = classes.map((c) => c.name);
  const unlinked = students.filter((s) => !s.archived && !s.parent_id).length;

  return (
    <div className="p-6 max-w-3xl">
      <PageHeader
        title="Students"
        subtitle="Your school's full student list. Add everyone here, then link each child to a parent from the Parents page."
        actions={
          <>
            <a href="#add-student" className={btnPrimary}>
              <UserPlus className="w-4 h-4" /> Add student
            </a>
            <Link href="/admin/import?type=students" className={btnSecondary}>
              <Upload className="w-4 h-4" /> Import many
            </Link>
          </>
        }
      />

      {unlinked > 0 && (
        <div className="mb-6">
          <InfoNote tone="amber">
            {unlinked} student{unlinked === 1 ? " isn't" : "s aren't"} linked to a parent yet, so no parent can generate a pickup code for
            them. On the <Link href="/admin/parents" className="font-semibold underline">Parents</Link> page, use <strong>Add child</strong> on a
            parent and pick the child from the list.
          </InfoNote>
        </div>
      )}

      <div className="mb-8">
        <StudentsList students={students} levels={levels} />
      </div>

      <Section id="add-student" icon={GraduationCap} title="Add a student" hint="One at a time. For a whole class or school, use Import many.">
        <AddStudentForm schoolId={schoolId} levels={levels} />
      </Section>
    </div>
  );
}
