import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { fieldErrorResponse, parseBody } from "@/lib/validate";
import { escapeLike, findLoginConflict, newPassword, optionalEmail, optionalPhone, requiredName } from "@/lib/identity";
import bcrypt from "bcryptjs";

// One CSV row = one guard or teacher. Admins can't be imported: granting full
// school access stays with the VerifyGate superadmin (as with the single form).
const schema = z.object({
  schoolId: z.string().uuid(),
  name: requiredName,
  email: optionalEmail,
  loginPhone: optionalPhone,
  role: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .nullable()
    .transform((r) => r || "guard")
    .refine((r) => r !== "admin", "Admins can't be imported. Ask VerifyGate to add another admin.")
    .refine((r) => r === "guard" || r === "teacher", "Role must be guard or teacher."),
  password: z.string().trim().optional().nullable(),
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
    const { schoolId, name, email, loginPhone, role, password } = parsed.data;
    if (schoolId !== sessionSchoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!email && !loginPhone) {
      const text = "Each row needs an email or a login phone.";
      return fieldErrorResponse({ email: text, loginPhone: text });
    }

    // Re-uploading the same file must not fail or duplicate: someone already
    // in this school with this email/phone is skipped, and never modified.
    const matches = await Promise.all([
      email
        ? supabaseAdmin.from("staff").select("id").ilike("email", escapeLike(email)).eq("school_id", schoolId).limit(1)
        : Promise.resolve({ data: [] }),
      loginPhone
        ? supabaseAdmin.from("staff").select("id").eq("login_phone", loginPhone).eq("school_id", schoolId).limit(1)
        : Promise.resolve({ data: [] }),
    ]);
    if (matches.some((m) => m.data?.length)) {
      return NextResponse.json({ ok: true, created: false, existed: true });
    }

    const pw = newPassword.safeParse(password ?? "");
    if (!pw.success) {
      return fieldErrorResponse({ password: password ? pw.error.issues[0].message : "Enter a password for this person." });
    }

    const conflict = await findLoginConflict({ email, loginPhone });
    if (conflict) return fieldErrorResponse(conflict, 409);

    const { error } = await supabaseAdmin.from("staff").insert({
      name,
      email,
      login_phone: loginPhone,
      password: await bcrypt.hash(pw.data, 12),
      role,
      school_id: schoolId,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, created: true, existed: false });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
