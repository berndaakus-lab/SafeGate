import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { fieldErrorResponse, parseBody, type FieldErrors } from "@/lib/validate";
import { escapeLike, findLoginConflict, newPassword, optionalEmail, optionalPhone } from "@/lib/identity";
import bcrypt from "bcryptjs";

// One CSV row: a parent (new or existing) plus optionally one child.
// New parents need a name and password; rows for a parent who already exists
// in this school only need their email or login phone, and never overwrite
// that parent's saved details.
const schema = z.object({
  schoolId: z.string().uuid(),
  parentName: z.string().trim().max(200, "That name is too long.").optional().nullable(),
  parentEmail: optionalEmail,
  parentLoginPhone: optionalPhone,
  parentPhone: optionalPhone,
  password: z.string().trim().max(200).optional().nullable(),
  childName: z.string().trim().max(200, "That name is too long.").optional().nullable(),
  childClass: z.string().trim().max(100, "That class name is too long.").optional().nullable(),
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
    if (!email && !loginPhone) {
      const text = "Each row needs the parent's email or login phone.";
      return fieldErrorResponse({ parentEmail: text, parentLoginPhone: text });
    }

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

    let parentCreated = false;
    if (!parent) {
      const errors: FieldErrors = {};
      if (!parentName) errors.parentName = "Enter the parent's name (needed for a new parent).";
      const pw = newPassword.safeParse(password ?? "");
      if (!pw.success) errors.password = password ? pw.error.issues[0].message : "Enter a password (needed for a new parent).";
      if (Object.keys(errors).length) return fieldErrorResponse(errors);

      const conflict = await findLoginConflict({ email, loginPhone });
      if (conflict) {
        return fieldErrorResponse(
          { ...(conflict.email && { parentEmail: conflict.email }), ...(conflict.loginPhone && { parentLoginPhone: conflict.loginPhone }) },
          409
        );
      }

      const { data: newParent, error: parentError } = await supabaseAdmin
        .from("parents")
        .insert({
          name: parentName,
          email,
          login_phone: loginPhone,
          phone: parentPhone,
          password: await bcrypt.hash(pw.data!, 12),
          must_change_password: true,
          school_id: schoolId,
        })
        .select("id")
        .single();

      if (parentError) return NextResponse.json({ error: parentError.message }, { status: 500 });
      parent = newParent;
      parentCreated = true;
    }

    // Re-uploading the same file (e.g. after fixing a few bad rows) must not
    // add the same child twice.
    let childAdded = false;
    let childExisted = false;
    if (childName) {
      const { data: existingChild } = await supabaseAdmin
        .from("students")
        .select("id")
        .eq("parent_id", parent!.id)
        .ilike("name", escapeLike(childName))
        .limit(1);
      if (existingChild?.length) {
        childExisted = true;
      } else {
        const { error: childError } = await supabaseAdmin.from("students").insert({
          name: childName,
          class_name: childClass || null,
          parent_id: parent!.id,
          school_id: schoolId,
        });
        if (childError) return NextResponse.json({ error: childError.message }, { status: 500 });
        childAdded = true;
      }
    }

    return NextResponse.json({ ok: true, parentCreated, childAdded, childExisted });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
