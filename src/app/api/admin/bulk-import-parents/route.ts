import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId, parentName, parentEmail, parentPhone, password, childName, childClass } =
      await req.json();

    if (!schoolId || !parentName || !parentEmail || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const email = parentEmail.trim().toLowerCase();

    // Find or create parent
    let { data: parent } = await supabaseAdmin
      .from("parents")
      .select("id")
      .eq("email", email)
      .eq("school_id", schoolId)
      .single();

    let created = false;
    if (!parent) {
      const hashedPassword = await bcrypt.hash(password.trim(), 12);
      const { data: newParent, error: parentError } = await supabaseAdmin
        .from("parents")
        .insert({
          name: parentName.trim(),
          email,
          phone: parentPhone?.trim() || null,
          password: hashedPassword,
          school_id: schoolId,
        })
        .select("id")
        .single();

      if (parentError) {
        return NextResponse.json({ error: parentError.message }, { status: 500 });
      }
      parent = newParent;
      created = true;
    }

    // Add child if provided
    let childAdded = false;
    if (childName?.trim()) {
      const { error: childError } = await supabaseAdmin.from("students").insert({
        name: childName.trim(),
        class_name: childClass?.trim() || null,
        parent_id: parent!.id,
        school_id: schoolId,
      });
      if (!childError) childAdded = true;
    }

    return NextResponse.json({
      ok: true,
      parentCreated: created,
      parentExisted: !created,
      childAdded,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
