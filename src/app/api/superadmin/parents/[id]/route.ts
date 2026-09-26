import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, isReservedSuperadminEmail } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = await parseBody(req, schema);
  if (parsed.error) return parsed.error;
  const { name, email, phone } = parsed.data;

  if (isReservedSuperadminEmail(email)) {
    return NextResponse.json({ error: "That email is reserved and cannot be used for a parent account." }, { status: 409 });
  }

  const { data: existing } = await supabaseAdmin.from("parents").select("id").eq("email", email).neq("id", id).single();
  if (existing) return NextResponse.json({ error: "That email is already used by another parent." }, { status: 409 });

  const { error } = await supabaseAdmin.from("parents").update({ name, email, phone: phone || null }).eq("id", id);
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
