import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { escapeLike, findLoginConflict, optionalEmail, optionalPhone, requiredName } from "@/lib/identity";
import bcrypt from "bcryptjs";

const schema = z.object({
  schoolId: z.string().uuid(),
  parentName: requiredName,
  parentEmail: optionalEmail,
  parentLoginPhone: optionalPhone,
  parentPhone: optionalPhone,
  password: z.string().min(6, "default_password must be at least 6 characters.").max(200),
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
    const { schoolId, parentName, parentEmail: email, parentLoginPhone: loginPhone, parentPhone, password, childName, childClass } =
      parsed.data;

    if (schoolId !== sessionSchoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const label = email ?? loginPhone;
    if (!label) {
      return NextResponse.json({ error: "Each row needs a parent email or login phone." }, { status: 400 });
    }

    // Re-running an import (or a parent with several children on separate
    // rows) reuses the existing parent in this school instead of failing.
    let parent: { id: string } | null = null;
    if (email) {
      const { data } = await supabaseAdmin
        .from("parents").select("id").ilike("email", escapeLike(email)).eq("school_id", schoolId).maybeSingle();
      parent = data;
    }
    if (!parent && loginPhone) {
      const { data } = await supabaseAdmin
        .from("parents").select("id").eq("login_phone", loginPhone).eq("school_id", schoolId).maybeSingle();
      parent = data;
    }

    let created = false;
    if (!parent) {
      const conflict = await findLoginConflict({ email, loginPhone });
      if (conflict) {
        return NextResponse.json({ error: `Row for ${label}: ${conflict.email ?? conflict.loginPhone}` }, { status: 409 });
      }

      const hashedPassword = await bcrypt.hash(password.trim(), 12);
      const { data: newParent, error: parentError } = await supabaseAdmin
        .from("parents")
        .insert({
          name: parentName,
          email,
          login_phone: loginPhone,
          phone: parentPhone,
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

    let childAdded = false;
    if (childName) {
      const { error: childError } = await supabaseAdmin.from("students").insert({
        name: childName,
        class_name: childClass || null,
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
