import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { fieldErrorResponse, parseBody } from "@/lib/validate";
import { findLoginConflict, optionalEmail, optionalPhone, requiredName } from "@/lib/identity";

const schema = z.object({
  name: requiredName,
  email: optionalEmail,
  loginPhone: optionalPhone,
  phone: optionalPhone,
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = await parseBody(req, schema);
  if (parsed.error) return parsed.error;
  const { name, email, loginPhone, phone } = parsed.data;

  const conflict = await findLoginConflict({ email, loginPhone, excludeParentId: id });
  if (conflict) return fieldErrorResponse(conflict, 409);

  const { error } = await supabaseAdmin
    .from("parents")
    .update({ name, email, login_phone: loginPhone, phone })
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

  const { count: studentCount } = await supabaseAdmin
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);

  if ((studentCount ?? 0) > 0) {
    return NextResponse.json(
      { error: `This parent has ${studentCount} student(s) linked. Reassign or remove those students first.` },
      { status: 409 }
    );
  }

  const { error } = await supabaseAdmin.from("parents").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
