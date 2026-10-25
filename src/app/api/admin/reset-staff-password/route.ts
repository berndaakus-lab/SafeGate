import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { randomPassword } from "@/lib/passwords";

// School admin: give a guard or teacher at their school a new random temporary
// password (forgotten or lost). It is returned once, and the person must choose
// their own at next sign-in. Other admins are not covered: their passwords are
// reset by the VerifyGate team, so one admin can't take over another's account.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const schoolId = (session?.user as any)?.schoolId;
    if ((session?.user as any)?.role !== "admin" || !schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, z.object({ staffId: z.string().uuid() }));
    if (parsed.error) return parsed.error;

    const password = randomPassword();
    const { data, error } = await supabaseAdmin
      .from("staff")
      .update({ password: await bcrypt.hash(password, 12), must_change_password: true })
      .eq("id", parsed.data.staffId)
      .eq("school_id", schoolId)
      .in("role", ["guard", "teacher"])
      .select("id");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    return NextResponse.json({ password });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
