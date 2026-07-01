import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["admin", "superadmin"].includes(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, className, parentId, schoolId, photoData } = await req.json();
    if (!name || !parentId || !schoolId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

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
        class_name: className || null,
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
