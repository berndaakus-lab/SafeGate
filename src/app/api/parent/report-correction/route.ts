import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";

const schema = z.object({
  studentId: z.string().uuid(),
  message: z.string().trim().min(3, "Tell the school what is wrong.").max(500, "Please keep it under 500 characters."),
});

// Parent: flag a wrong name or class on their child. They can't edit it
// themselves; the school admin sees the request and makes the change.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const parentId = (session?.user as any)?.id;
    if ((session?.user as any)?.role !== "parent" || !parentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { studentId, message } = parsed.data;

    const { data: student } = await supabaseAdmin
      .from("students")
      .select("school_id")
      .eq("id", studentId)
      .eq("parent_id", parentId)
      .is("archived_at", null)
      .maybeSingle();
    if (!student) return NextResponse.json({ error: "Child not found on your account" }, { status: 404 });

    // One open request per child: sending again replaces the message rather
    // than piling up duplicates.
    const { data: open } = await supabaseAdmin
      .from("student_corrections")
      .select("id")
      .eq("student_id", studentId)
      .is("resolved_at", null)
      .maybeSingle();

    const { error } = open
      ? await supabaseAdmin.from("student_corrections").update({ message, created_at: new Date().toISOString() }).eq("id", open.id)
      : await supabaseAdmin
          .from("student_corrections")
          .insert({ school_id: student.school_id, student_id: studentId, parent_id: parentId, message });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
