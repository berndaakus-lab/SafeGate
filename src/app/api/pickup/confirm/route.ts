import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendPickupSMS } from "@/lib/sms";

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

    // Fetch SMS data BEFORE creating log (while we have the code data)
    const { data: codeData } = await supabaseAdmin
      .from("pickup_codes")
      .select(`
        parent_id,
        parents(name, phone),
        students(name, schools(name)),
        authorized_persons(name)
      `)
      .eq("id", pickupCodeId)
      .single();

    // Create pickup log
    const { data: log, error } = await supabaseAdmin
      .from("pickup_logs")
      .insert({
        pickup_code_id: pickupCodeId,
        student_id: studentId,
        authorized_person_id: authorizedPersonId,
        parent_id: codeData?.parent_id ?? null,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Mark code as used
    await supabaseAdmin
      .from("pickup_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", pickupCodeId);

    // Send SMS — awaited so Vercel doesn't kill it before it fires
    if (codeData) {
      const parent = Array.isArray(codeData.parents) ? codeData.parents[0] : codeData.parents as any;
      const student = Array.isArray(codeData.students) ? codeData.students[0] : codeData.students as any;
      const person = Array.isArray(codeData.authorized_persons) ? codeData.authorized_persons[0] : codeData.authorized_persons as any;
      const school = Array.isArray(student?.schools) ? student.schools[0] : student?.schools as any;

      console.log("[confirm] parent:", parent?.name, "phone:", parent?.phone);

      if (parent?.phone) {
        await sendPickupSMS({
          parentPhone: parent.phone,
          studentName: student?.name ?? "Your child",
          collectedBy: person?.name ?? "an authorised person",
          schoolName: school?.name ?? "school",
        });
      } else {
        console.warn("[confirm] No parent phone — SMS skipped. parent_id:", codeData.parent_id);
      }
    }

    return NextResponse.json(log, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
