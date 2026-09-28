import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { fieldErrorResponse, parseBody } from "@/lib/validate";
import { findLoginConflict, optionalEmail, optionalPhone, requiredName } from "@/lib/identity";

// Superadmin may set any of these roles (unlike a school admin, who can only
// create guard/teacher), since superadmin is trusted platform-wide.
const schema = z.object({
  name: requiredName,
  email: optionalEmail,
  loginPhone: optionalPhone,
  role: z.enum(["admin", "guard", "teacher"], "Choose admin, guard or teacher."),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = await parseBody(req, schema);
  if (parsed.error) return parsed.error;
  const { name, email, loginPhone, role } = parsed.data;

  const conflict = await findLoginConflict({ email, loginPhone, excludeStaffId: id });
  if (conflict) return fieldErrorResponse(conflict, 409);

  const { error } = await supabaseAdmin
    .from("staff")
    .update({ name, email, login_phone: loginPhone, role })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await supabaseAdmin.from("staff").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
