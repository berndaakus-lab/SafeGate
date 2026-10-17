import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { getSchoolClasses, resolveClass } from "@/lib/school-classes";

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  className: z.string().trim().max(100).optional().nullable(),
  parentId: z.string().uuid(),
  schoolId: z.string().uuid(),
  photoData: z.string().startsWith("data:image/").max(7_000_000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["admin", "superadmin"].includes(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionSchoolId = (session?.user as any)?.schoolId;
    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { name, className, parentId, schoolId, photoData } = parsed.data;
    if (role === "admin" && schoolId !== sessionSchoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ensure the parent actually belongs to this school before linking a student to them
    const { data: parentRecord } = await supabaseAdmin
      .from("parents")
      .select("id")
      .eq("id", parentId)
      .eq("school_id", schoolId)
      .single();
    if (!parentRecord) {
      return NextResponse.json({ error: "Parent not found for this school" }, { status: 400 });
    }

    const resolved = resolveClass(className, await getSchoolClasses(schoolId));
    if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: 400 });

    let photoUrl: string | null = null;

    // Upload compressed photo if provided (base64 data URL)
    if (photoData) {
      const base64 = photoData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");
      const filename = `${schoolId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("student-photos")
        .upload(filename, buffer, { contentType: "image/jpeg", upsert: false });

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from("student-photos")
          .getPublicUrl(filename);
        photoUrl = urlData.publicUrl;
      } else {
        console.warn("[add-student] photo upload failed:", uploadError.message);
      }
    }

    const { data, error } = await supabaseAdmin
      .from("students")
      .insert({
        name,
        class_name: resolved.value,
        class_id: resolved.id,
        parent_id: parentId,
        school_id: schoolId,
        photo_url: photoUrl,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
