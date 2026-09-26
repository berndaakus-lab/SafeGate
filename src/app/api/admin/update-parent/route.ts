import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";

const schema = z.object({
  parentId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().nullable(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = (session?.user as any)?.schoolId;
    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { parentId, name, email, phone } = parsed.data;

    // Check email not taken by another parent
    const { data: existing } = await supabaseAdmin
      .from("parents")
      .select("id")
      .eq("email", email)
      .neq("id", parentId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "That email is already used by another parent." }, { status: 409 });
    }

    const { error } = await supabaseAdmin
      .from("parents")
      .update({ name, email, phone: phone || null })
      .eq("id", parentId)
      .eq("school_id", schoolId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
