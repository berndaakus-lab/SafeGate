import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { saveStudentPhoto, studentPhotoData } from "@/lib/student-photo";

const schema = z.object({ studentId: z.string().uuid(), photoData: studentPhotoData });

// School admin: add, change or remove the photo of any child in their school
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;
  if ((session?.user as any)?.role !== "admin" || !schoolId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseBody(req, schema);
  if (parsed.error) return parsed.error;
  const { studentId, photoData } = parsed.data;

  const { data: student } = await supabaseAdmin
    .from("students")
    .select("photo_url")
    .eq("id", studentId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const result = await saveStudentPhoto({ studentId, schoolId, currentUrl: student.photo_url, dataUrl: photoData });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result);
}
