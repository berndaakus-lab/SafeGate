import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { fieldErrorResponse, parseBody, type FieldErrors } from "@/lib/validate";
import { escapeLike, findLoginConflict, newPassword, optionalEmail, optionalPhone } from "@/lib/identity";
import { ensureClass, getSchoolClasses } from "@/lib/school-classes";
import { cleanName, findSameStudents, placeholderParentName } from "@/lib/students";
import { randomPassword } from "@/lib/passwords";
import bcrypt from "bcryptjs";

// One CSV row: a parent (new or existing) plus optionally one child.
// New parents need a password (a random one is made if the row has none); rows for a parent who already exists
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

    // Checked before anything is created so a bad class never leaves a parent half-imported
    const resolvedClass = await ensureClass(schoolId, childClass, await getSchoolClasses(schoolId));
    if ("error" in resolvedClass) return fieldErrorResponse({ childClass: resolvedClass.error });

    // A child already on the school's student list (not yet linked to a parent)
    // is linked instead of duplicated. If the name is ambiguous, stop before
    // anything is created so the row can be fixed or linked by hand.
    const rollMatches = childName
      ? (await findSameStudents(schoolId, childName, resolvedClass.id ?? undefined)).filter((s) => !s.parent_id)
      : [];
    if (rollMatches.length > 1) {
      return fieldErrorResponse({
        childName: `More than one "${cleanName(childName!)}" is on your student list. Add the class to this row, or link the right one from the Parents page.`,
      });
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

    // No parent name in the spreadsheet: use the child's surname, marked as a stand-in
    const newParentName = parentName || placeholderParentName(childName);

    let parentCreated = false;
    let generatedPassword: string | null = null;
    if (!parent) {
      const errors: FieldErrors = {};
      if (!newParentName) errors.parentName = "Enter the parent's name, or a child name so one can be made from the surname.";
      // No password in the spreadsheet: make a different random one for this parent
      const chosen = password || randomPassword();
      const pw = newPassword.safeParse(chosen);
      if (!pw.success) errors.password = pw.error.issues[0].message;
      generatedPassword = password ? null : chosen;
      if (Object.keys(errors).length) return fieldErrorResponse(errors);

      const conflict = await findLoginConflict({ email, loginPhone, schoolId });
      if (conflict) {
        return fieldErrorResponse(
          { ...(conflict.email && { parentEmail: conflict.email }), ...(conflict.loginPhone && { parentLoginPhone: conflict.loginPhone }) },
          409
        );
      }

      const { data: newParent, error: parentError } = await supabaseAdmin
        .from("parents")
        .insert({
          name: newParentName,
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
    let childLinked = false;
    if (childName) {
      const { data: existingChild } = await supabaseAdmin
        .from("students")
        .select("id")
        .eq("parent_id", parent!.id)
        .ilike("name", escapeLike(childName))
        .limit(1);
      if (existingChild?.length) {
        childExisted = true;
      } else if (rollMatches.length === 1) {
        const { data: linked, error: linkError } = await supabaseAdmin
          .from("students")
          .update({ parent_id: parent!.id })
          .eq("id", rollMatches[0].id)
          .eq("school_id", schoolId)
          .is("parent_id", null)
          .select("id");
        if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });
        if (linked?.length) {
          childAdded = true;
          childLinked = true;
        } else {
          childExisted = true;
        }
      } else {
        const { error: childError } = await supabaseAdmin.from("students").insert({
          name: childName,
          class_name: resolvedClass.value,
          class_id: resolvedClass.id,
          parent_id: parent!.id,
          school_id: schoolId,
        });
        if (childError) return NextResponse.json({ error: childError.message }, { status: 500 });
        childAdded = true;
      }
    }

    // generatedPassword is shown to the admin once, right after the import; only its hash is kept
    return NextResponse.json({ ok: true, parentCreated, childAdded, childExisted, childLinked, generatedPassword, parentName: parentCreated ? newParentName : null });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
