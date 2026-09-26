import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, isReservedSuperadminEmail } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import bcrypt from "bcryptjs";

const schema = z.object({
  schoolId: z.string().uuid(),
  parentName: z.string().trim().min(1).max(200),
  parentEmail: z.string().trim().email().max(255),
  parentPhone: z.string().trim().max(30).optional().nullable(),
  password: z.string().min(6).max(200),
  childName: z.string().trim().max(200).optional().nullable(),
  childClass: z.string().trim().max(100).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionSchoolId = (session?.user as any)?.schoolId;
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { schoolId, parentName, parentEmail, parentPhone, password, childName, childClass } = parsed.data;

    if (schoolId !== sessionSchoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const email = parentEmail.trim().toLowerCase();

    if (isReservedSuperadminEmail(email)) {
      return NextResponse.json({ error: `Row for ${email}: that email is reserved and cannot be used for a parent account.` }, { status: 409 });
    }

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
