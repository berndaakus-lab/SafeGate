import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { passwordFingerprint } from "@/lib/pwf";
import { keepSignedInAfterPasswordChange } from "@/lib/session-cookie";
import bcrypt from "bcryptjs";

const schema = z.object({
  currentPassword: z.string().optional(),
  // First sign-in: a parent confirms or corrects the name the school entered
  name: z.string().trim().min(1, "Enter your name.").max(200, "That name is too long.").optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { currentPassword, newPassword, name } = parsed.data;

    // "Parent of <child>" is only the stand-in the school entered; a parent must replace it
    if (name && /^parent of /i.test(name)) {
      return NextResponse.json({ error: "Please type your own full name instead of \"Parent of ...\"." }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const table = role === "parent" ? "parents" : "staff";

    // Fetch current hashed password
    const { data: user } = await supabaseAdmin
      .from(table)
      .select("password, must_change_password")
      .eq("id", userId)
      .single();

    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    // First sign-in with an admin-set temporary password: the session already
    // proves they know it, so only the new password is asked for.
    const forced = user.must_change_password === true;
    if (!forced || currentPassword) {
      const valid = await bcrypt.compare(currentPassword ?? "", user.password);
      if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    if (forced && (await bcrypt.compare(newPassword, user.password))) {
      return NextResponse.json({ error: "Choose a different password from the temporary one." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    const { error } = await supabaseAdmin
      .from(table)
      .update({ password: hashed, must_change_password: false, ...(name && role === "parent" ? { name } : {}) })
      .eq("id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Every other sign-in for this account stops working; this device stays signed in
    const res = NextResponse.json({ success: true });
    await keepSignedInAfterPasswordChange(req, res, passwordFingerprint(hashed));
    return res;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
