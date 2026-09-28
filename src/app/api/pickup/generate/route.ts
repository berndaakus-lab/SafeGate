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

    // Every selected child must belong to this parent
    const { data: students } = await supabaseAdmin
      .from("students")
      .select("id, name")
      .in("id", studentIds)
      .eq("parent_id", parentId);
    if (!students || students.length !== studentIds.length) {
      return NextResponse.json({ error: "One of the selected children was not found on your account." }, { status: 404 });
    }

    const { data: person } = await supabaseAdmin
      .from("authorized_persons")
      .select("id")
      .eq("id", authorizedPersonId)
      .eq("parent_id", parentId)
      .single();
    if (!person) return NextResponse.json({ error: "That pickup person was not found on your account." }, { status: 404 });

    // Code expires end of today
    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999);

    // pickup_codes.code is unique across all time, so retry on any existing match
    let code = shortCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: existing } = await supabaseAdmin.from("pickup_codes").select("id").eq("code", code).maybeSingle();
      if (!existing) break;
      code = shortCode();
    }

    const { data: pickupCode, error } = await supabaseAdmin
      .from("pickup_codes")
      .insert({
        code,
        student_id: studentIds[0],
        student_ids: studentIds,
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

    // Return names in the order the parent picked them
    const names = studentIds.map((id) => students.find((s) => s.id === id)!.name);
    return NextResponse.json({ qrUrl, code: pickupCode.code, expiresAt: pickupCode.expires_at, childNames: names });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
