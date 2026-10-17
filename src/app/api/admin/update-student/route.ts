import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { getSchoolClasses, resolveClass } from "@/lib/school-classes";

const schema = z.object({
  studentId: z.string().uuid(),
  name: z.string().trim().min(1, "Enter the child's name.").max(200),
  className: z.string().trim().max(100, "That class name is too long.").optional().nullable(),
});

// School admin: correct a child's name or move them to another class
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const schoolId = (session?.user as any)?.schoolId;
    if ((session?.user as any)?.role !== "admin" || !schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { studentId, name, className } = parsed.data;

    const { data: existing } = await supabaseAdmin
      .from("students")
      .select("class_name")
      .eq("id", studentId)
      .eq("school_id", schoolId)
      .maybeSingle();
    if (!existing) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const resolved = resolveClass(className, await getSchoolClasses(schoolId));
    if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("students")
      .update({ name, class_name: resolved.value, class_id: resolved.id })
      .eq("id", studentId)
      .eq("school_id", schoolId)
      .select("id");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
