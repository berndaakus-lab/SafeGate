import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { fieldErrorResponse, parseBody } from "@/lib/validate";
import { findLoginConflict, optionalEmail, optionalPhone, requiredName } from "@/lib/identity";

// School admin: correct a guard's or teacher's name, role or sign-in details.
// Admin accounts are not covered (the VerifyGate team manages those), and the
// role can only be guard or teacher, so nobody can be made an admin here.
const schema = z.object({
  staffId: z.string().uuid(),
  name: requiredName,
  email: optionalEmail,
  loginPhone: optionalPhone,
  role: z.enum(["guard", "teacher"], "Choose guard or teacher."),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const schoolId = (session?.user as any)?.schoolId;
    if ((session?.user as any)?.role !== "admin" || !schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { staffId, name, email, loginPhone, role } = parsed.data;

    const conflict = await findLoginConflict({ email, loginPhone, excludeStaffId: staffId, schoolId });
    if (conflict) return fieldErrorResponse(conflict, 409);

    const { data, error } = await supabaseAdmin
      .from("staff")
      .update({ name, email, login_phone: loginPhone, role })
      .eq("id", staffId)
      .eq("school_id", schoolId)
      .in("role", ["guard", "teacher"])
      .select("id");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
