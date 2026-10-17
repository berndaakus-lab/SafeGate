import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { fieldErrorResponse, parseBody } from "@/lib/validate";
import { findLoginConflict, newPassword, optionalEmail, optionalPhone, requiredName } from "@/lib/identity";
import bcrypt from "bcryptjs";

// Unlike a school admin (guard/teacher only), the superadmin can also add
// admins, so granting full school access stays a platform-level decision.
const schema = z.object({
  schoolId: z.string().uuid(),
  name: requiredName,
  email: optionalEmail,
  loginPhone: optionalPhone,
  password: newPassword,
  role: z.enum(["admin", "guard", "teacher"], "Choose admin, guard or teacher."),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseBody(req, schema);
  if (parsed.error) return parsed.error;
  const { schoolId, name, email, loginPhone, password, role } = parsed.data;

  const { data: school } = await supabaseAdmin.from("schools").select("id").eq("id", schoolId).maybeSingle();
  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

  const conflict = await findLoginConflict({ email, loginPhone });
  if (conflict) return fieldErrorResponse(conflict, 409);

  const { error } = await supabaseAdmin.from("staff").insert({
    name,
    email,
    login_phone: loginPhone,
    password: await bcrypt.hash(password, 12),
    must_change_password: true,
    role,
    school_id: schoolId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
