import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parentId = (session.user as any).id;
    const { studentId, authorizedPersonId } = await req.json();

    if (!studentId || !authorizedPersonId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify student belongs to this parent
    const { data: student } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("id", studentId)
      .eq("parent_id", parentId)
      .single();
    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Verify authorized person belongs to this parent
    const { data: person } = await supabaseAdmin
      .from("authorized_persons")
      .select("id")
      .eq("id", authorizedPersonId)
      .eq("parent_id", parentId)
      .single();
    if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Code expires end of today
    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999);

    const { data: pickupCode, error } = await supabaseAdmin
      .from("pickup_codes")
      .insert({
        student_id: studentId,
        parent_id: parentId,
        authorized_person_id: authorizedPersonId,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const verifyUrl = `${process.env.NEXTAUTH_URL}/guard/verify/${pickupCode.code}`;
    const qrUrl = await QRCode.toDataURL(verifyUrl, {
      width: 400,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    });

    return NextResponse.json({ qrUrl, code: pickupCode.code, expiresAt: pickupCode.expires_at });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
