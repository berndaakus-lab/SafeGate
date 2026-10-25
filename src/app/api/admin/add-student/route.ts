import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { getSchoolClasses, resolveClass } from "@/lib/school-classes";
import { cleanName, findSameStudents } from "@/lib/students";

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  className: z.string().trim().max(100).optional().nullable(),
  // Left out when adding to the school's student list before a parent is linked
  parentId: z.string().uuid().optional().nullable(),
  schoolId: z.string().uuid(),
  allowDuplicate: z.boolean().optional(),
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
    const { name: rawName, className, parentId, schoolId, photoData, allowDuplicate } = parsed.data;
    const name = cleanName(rawName);
    if (role === "admin" && schoolId !== sessionSchoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ensure the parent actually belongs to this school before linking a student to them
    if (parentId) {
      const { data: parentRecord } = await supabaseAdmin
        .from("parents")
        .select("id")
        .eq("id", parentId)
        .eq("school_id", schoolId)
        .single();
      if (!parentRecord) {
        return NextResponse.json({ error: "Parent not found for this school" }, { status: 400 });
      }
    }

    const resolved = resolveClass(className, await getSchoolClasses(schoolId));
    if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: 400 });

    if (!allowDuplicate) {
      const same = await findSameStudents(schoolId, name, resolved.id);
      if (same.length) {
        const where = same[0].parentName ? `already linked to ${same[0].parentName}` : "already on your student list";
        return NextResponse.json(
          { error: `"${name}" is ${where}. Add another child with the same name and class anyway?`, code: "duplicate" },
          { status: 409 }
        );
      }
    }

    let photoUrl: string | null = null;

    // Upload compressed photo if provided (base64 data URL)
    if (photoData) {
      const base64 = photoData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");
      // A random name so a photo's address can't be guessed from the school id and a time
      const filename = `${schoolId}/${crypto.randomUUID()}.jpg`;

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
        parent_id: parentId ?? null,
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
