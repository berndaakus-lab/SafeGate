import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";

const schema = z.object({ studentId: z.string().uuid(), parentId: z.string().uuid().nullable() });

// School admin: link a student from the school's list to a parent, or unlink
// them (parentId null). A child has exactly one parent, so linking a child who
// already has one is refused: unlink first.
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const schoolId = (session?.user as any)?.schoolId;
    if ((session?.user as any)?.role !== "admin" || !schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { studentId, parentId } = parsed.data;

    const { data: student } = await supabaseAdmin
      .from("students")
      .select("id, parent_id, parents(name)")
      .eq("id", studentId)
      .eq("school_id", schoolId)
      .maybeSingle();
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    if (parentId) {
      const { data: parent } = await supabaseAdmin
        .from("parents")
        .select("id")
        .eq("id", parentId)
        .eq("school_id", schoolId)
        .maybeSingle();
      if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });

      if (student.parent_id && student.parent_id !== parentId) {
        const current: any = Array.isArray(student.parents) ? student.parents[0] : student.parents;
        return NextResponse.json(
          { error: `This child is already linked to ${current?.name ?? "another parent"}. Unlink them first.` },
          { status: 409 }
        );
      }
    }

    // Match on the current parent so two admins can't link the same child at once
    let update = supabaseAdmin.from("students").update({ parent_id: parentId }).eq("id", studentId).eq("school_id", schoolId);
    update = parentId ? update.is("parent_id", null) : update;
    const { data, error } = await update.select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (parentId && !data?.length && student.parent_id !== parentId) {
      return NextResponse.json({ error: "This child was just linked to a parent. Refresh and try again." }, { status: 409 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
