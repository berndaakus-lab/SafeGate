import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { saveStudentPhoto, studentPhotoData } from "@/lib/student-photo";

const schema = z.object({ studentId: z.string().uuid(), photoData: studentPhotoData });

// Parents add their own children's photos so the school doesn't have to.
// It goes live straight away; the school admin sees every photo on the
// Parents page and can replace one that's wrong.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const parentId = (session?.user as any)?.id;
  if ((session?.user as any)?.role !== "parent" || !parentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseBody(req, schema);
  if (parsed.error) return parsed.error;
  const { studentId, photoData } = parsed.data;

  const { data: student } = await supabaseAdmin
    .from("students")
    .select("photo_url, school_id")
    .eq("id", studentId)
    .eq("parent_id", parentId)
    .maybeSingle();
  if (!student) return NextResponse.json({ error: "Child not found on your account" }, { status: 404 });

  const result = await saveStudentPhoto({
    studentId,
    schoolId: student.school_id,
    currentUrl: student.photo_url,
    dataUrl: photoData,
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result);
}
