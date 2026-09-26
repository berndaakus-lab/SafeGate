import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import bcrypt from "bcryptjs";

const schema = z.object({
  staffId: z.string().uuid(),
  newPassword: z.string().min(6, "Password must be at least 6 characters.").max(200),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { staffId, newPassword } = parsed.data;

    const hashed = await bcrypt.hash(newPassword, 12);
    const { error } = await supabaseAdmin
      .from("staff")
      .update({ password: hashed })
      .eq("id", staffId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
