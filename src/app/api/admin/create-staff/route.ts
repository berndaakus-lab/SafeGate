import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { fieldErrorResponse, parseBody } from "@/lib/validate";
import { findLoginConflict, newPassword, optionalEmail, optionalPhone, requiredName } from "@/lib/identity";
import bcrypt from "bcryptjs";

// An admin may only create guard/teacher accounts, never admin or superadmin
// (privilege escalation guard).
const schema = z.object({
  name: requiredName,
  email: optionalEmail,
  loginPhone: optionalPhone,
  password: newPassword,
  role: z.enum(["guard", "teacher"], "Choose guard or teacher.").optional(),
  schoolId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionSchoolId = (session?.user as any)?.schoolId;
    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { name, email, loginPhone, password, role: staffRole, schoolId } = parsed.data;

    if (schoolId !== sessionSchoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const conflict = await findLoginConflict({ email, loginPhone, schoolId });
    if (conflict) return fieldErrorResponse(conflict, 409);

    const hashedPassword = await bcrypt.hash(password, 12);
    const { error } = await supabaseAdmin.from("staff").insert({
      name,
      email,
      login_phone: loginPhone,
      password: hashedPassword,
      must_change_password: true,
      role: staffRole || "guard",
      school_id: schoolId,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
