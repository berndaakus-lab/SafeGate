import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import QRCode from "qrcode";
import { randomInt } from "crypto";

function shortCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I confusion
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[randomInt(chars.length)];
  return code;
}

const schema = z.object({
  studentIds: z
    .array(z.string().uuid())
    .min(1, "Choose at least one child.")
    .max(20, "Too many children selected."),
  authorizedPersonId: z.string().uuid("Choose who is picking up."),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "parent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parentId = (session.user as any).id;
    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const studentIds = [...new Set(parsed.data.studentIds)];
    const { authorizedPersonId } = parsed.data;

    // Ownership checks are independent, so run them together
    const schoolId = (session.user as any).schoolId;
    const [{ data: students }, { data: person }, { data: school }] = await Promise.all([
      supabaseAdmin.from("students").select("id, name").in("id", studentIds).eq("parent_id", parentId).is("archived_at", null),
      supabaseAdmin.from("authorized_persons").select("id").eq("id", authorizedPersonId).eq("parent_id", parentId).maybeSingle(),
      supabaseAdmin.from("schools").select("is_active").eq("id", schoolId).maybeSingle(),
    ]);
    if (school?.is_active === false) {
      return NextResponse.json({ error: "Your school's VerifyGate account is currently offline. Contact the school." }, { status: 403 });
    }
    if (!students || students.length !== studentIds.length) {
      return NextResponse.json({ error: "One of the selected children was not found on your account." }, { status: 404 });
    }
    if (!person) return NextResponse.json({ error: "That pickup person was not found on your account." }, { status: 404 });

    // Code expires end of today
    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999);

    // pickup_codes.code is unique, so let the insert detect the (very rare)
    // collision and retry, instead of paying for a lookup on every request.
    let pickupCode: { code: string; expires_at: string } | null = null;
    for (let attempt = 0; attempt < 5 && !pickupCode; attempt++) {
      const { data, error } = await supabaseAdmin
        .from("pickup_codes")
        .insert({
          code: shortCode(),
          student_id: studentIds[0],
          student_ids: studentIds,
          parent_id: parentId,
          authorized_person_id: authorizedPersonId,
          expires_at: expiresAt.toISOString(),
        })
        .select("code, expires_at")
        .single();
      if (!error) pickupCode = data;
      else if (error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!pickupCode) return NextResponse.json({ error: "Could not create a unique code. Please try again." }, { status: 500 });

    const verifyUrl = `${process.env.NEXTAUTH_URL}/guard/verify/${pickupCode.code}`;
    const qrUrl = await QRCode.toDataURL(verifyUrl, {
      width: 400,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    });

    // Return names in the order the parent picked them
    const names = studentIds.map((id) => students.find((s) => s.id === id)!.name);
    return NextResponse.json({ qrUrl, code: pickupCode.code, expiresAt: pickupCode.expires_at, childNames: names });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
