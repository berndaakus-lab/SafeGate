import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const table = role === "parent" ? "parents" : "staff";

    // Fetch current hashed password
    const { data: user } = await supabaseAdmin
      .from(table)
      .select("password")
      .eq("id", userId)
      .single();

    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

    const hashed = await bcrypt.hash(newPassword, 12);
    const { error } = await supabaseAdmin
      .from(table)
      .update({ password: hashed })
      .eq("id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
