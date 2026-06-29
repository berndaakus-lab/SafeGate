import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { pickupCodeId, studentId, authorizedPersonId } = await req.json();
    if (!pickupCodeId || !studentId || !authorizedPersonId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check not already used
    const { data: existing } = await supabaseAdmin
      .from("pickup_logs")
      .select("id")
      .eq("pickup_code_id", pickupCodeId)
      .single();

    if (existing) return NextResponse.json({ error: "Already used" }, { status: 409 });

    const { data: log, error } = await supabaseAdmin
      .from("pickup_logs")
      .insert({ pickup_code_id: pickupCodeId, student_id: studentId, authorized_person_id: authorizedPersonId })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Mark code as used
    await supabaseAdmin
      .from("pickup_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", pickupCodeId);

    return NextResponse.json(log, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
