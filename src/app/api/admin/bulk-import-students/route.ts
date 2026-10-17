import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { fieldErrorResponse, parseBody } from "@/lib/validate";
import { ensureClass, getSchoolClasses } from "@/lib/school-classes";
import { cleanName, findSameStudents } from "@/lib/students";

// One CSV row: a student for the school's list. Parents are linked afterwards
// (or by the parents import), so no parent details are needed here.
const schema = z.object({
  schoolId: z.string().uuid(),
  studentName: z.string().trim().min(1, "Enter the student's name.").max(200, "That name is too long."),
  studentClass: z.string().trim().max(100, "That class name is too long.").optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionSchoolId = (session?.user as any)?.schoolId;
    if ((session?.user as any)?.role !== "admin" || !sessionSchoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { schoolId, studentName, studentClass } = parsed.data;
    if (schoolId !== sessionSchoolId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const resolved = await ensureClass(schoolId, studentClass, await getSchoolClasses(schoolId));
    if ("error" in resolved) return fieldErrorResponse({ studentClass: resolved.error });

    const name = cleanName(studentName);
    // Re-uploading the same file must not add the same student twice
    if ((await findSameStudents(schoolId, name, resolved.id)).length) {
      return NextResponse.json({ ok: true, created: false, existed: true });
    }

    const { error } = await supabaseAdmin
      .from("students")
      .insert({ name, class_name: resolved.value, class_id: resolved.id, school_id: schoolId, parent_id: null });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, created: true, existed: false });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
