import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { optionalPhone } from "@/lib/identity";

const schema = z.object({
  name: z.string().trim().min(1, "Enter the school name.").max(200, "That name is too long."),
  address: z.string().trim().max(500, "That address is too long.").optional().nullable(),
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
  const { name, address, phone } = parsed.data;

  const { error } = await supabaseAdmin
    .from("schools")
    .update({ name, address: address || null, phone: phone || null })
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

  // Refuse to delete a school that still has people in it, rather than
  // silently cascading. The superadmin must remove staff/parents/students
  // first, so a deletion is always a deliberate, understood action.
  const [{ count: staffCount }, { count: parentCount }, { count: studentCount }] = await Promise.all([
    supabaseAdmin.from("staff").select("id", { count: "exact", head: true }).eq("school_id", id),
    supabaseAdmin.from("parents").select("id", { count: "exact", head: true }).eq("school_id", id),
    supabaseAdmin.from("students").select("id", { count: "exact", head: true }).eq("school_id", id),
  ]);

  if ((staffCount ?? 0) > 0 || (parentCount ?? 0) > 0 || (studentCount ?? 0) > 0) {
    return NextResponse.json(
      { error: `Remove all staff (${staffCount}), parents (${parentCount}), and students (${studentCount}) from this school before deleting it.` },
      { status: 409 }
    );
  }

  const { error } = await supabaseAdmin.from("schools").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
