import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, isReservedSuperadminEmail } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";

// Superadmin may set any of these roles (unlike a school admin, who can only
// create guard/teacher), since superadmin is trusted platform-wide.
const schema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  role: z.enum(["admin", "guard", "teacher"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = await parseBody(req, schema);
  if (parsed.error) return parsed.error;
  const { name, email, role } = parsed.data;

  if (isReservedSuperadminEmail(email)) {
    return NextResponse.json({ error: "That email is reserved and cannot be used for a staff account." }, { status: 409 });
  }

  const { data: existing } = await supabaseAdmin.from("staff").select("id").eq("email", email).neq("id", id).single();
  if (existing) return NextResponse.json({ error: "That email is already used by another staff account." }, { status: 409 });

  const { error } = await supabaseAdmin.from("staff").update({ name, email, role }).eq("id", id);
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
