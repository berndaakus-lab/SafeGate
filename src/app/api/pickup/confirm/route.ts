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

    // Create log
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

    // Fetch details needed for SMS (non-blocking)
    supabaseAdmin
      .from("pickup_codes")
      .select(`
        parents(name, phone),
        students(name, schools(name)),
        authorized_persons(name)
      `)
      .eq("id", pickupCodeId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const parent = Array.isArray(data.parents) ? data.parents[0] : data.parents as any;
        const student = Array.isArray(data.students) ? data.students[0] : data.students as any;
        const person = Array.isArray(data.authorized_persons) ? data.authorized_persons[0] : data.authorized_persons as any;
        const school = Array.isArray(student?.schools) ? student.schools[0] : student?.schools as any;
        if (parent?.phone) {
          sendPickupSMS({
            parentPhone: parent.phone,
            studentName: student?.name ?? "Your child",
            collectedBy: person?.name ?? "an authorised person",
            schoolName: school?.name ?? "school",
          });
        }
      });

    return NextResponse.json(log, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
