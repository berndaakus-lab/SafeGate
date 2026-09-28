import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendNotification } from "@/lib/notifications";
import { parseBody } from "@/lib/validate";

const schema = z.object({
  pickupCodeId: z.string().uuid(),
  studentId: z.string().uuid(),
  authorizedPersonId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const guardSchoolId = (session?.user as any)?.schoolId;
    if (!session || !["guard", "teacher"].includes(role) || !guardSchoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { pickupCodeId, studentId, authorizedPersonId } = parsed.data;

    // Verify the pickup code belongs to the guard's own school
    const { data: codeSchool } = await supabaseAdmin
      .from("pickup_codes")
      .select("students(school_id)")
      .eq("id", pickupCodeId)
      .single();
    const studentSchoolId = (codeSchool?.students as any)?.school_id;
    if (studentSchoolId !== guardSchoolId) {
      return NextResponse.json({ error: "Code does not belong to your school" }, { status: 403 });
    }

    // Check not already used
    const { data: existing } = await supabaseAdmin
      .from("pickup_logs")
      .select("id")
      .eq("pickup_code_id", pickupCodeId)
      .single();
    if (existing) return NextResponse.json({ error: "Already used" }, { status: 409 });

    // Fetch all data needed for SMS before creating log
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

    const { data: log, error } = await supabaseAdmin
      .from("pickup_logs")
      .insert({
        pickup_code_id: pickupCodeId,
        student_id: studentId,
        authorized_person_id: authorizedPersonId,
        confirmed_by_staff_id: (session.user as any).id,
        confirmed_by_name: session.user?.name ?? null,
        confirmed_by_role: role,
      })
      .select()
      .single();

    if (error) {
      console.error("[confirm] insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mark code as used
    await supabaseAdmin
      .from("pickup_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", pickupCodeId);

    // Send SMS, awaited so Vercel doesn't shut down the function before it fires
    if (codeData) {
      const parent = Array.isArray(codeData.parents) ? codeData.parents[0] : codeData.parents as any;
      const student = Array.isArray(codeData.students) ? codeData.students[0] : codeData.students as any;
      const person = Array.isArray(codeData.authorized_persons) ? codeData.authorized_persons[0] : codeData.authorized_persons as any;
      const school = Array.isArray(student?.schools) ? student.schools[0] : student?.schools as any;

      console.log("[sms] parent:", parent?.name, "| phone:", parent?.phone, "| student:", student?.name);

      const time = new Date().toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" });
      const studentName = student?.name ?? "Your child";
      const collectedBy = person?.name ?? "an authorised person";
      const schoolName = school?.name ?? "school";

      await sendNotification({
        parentId: codeData.parent_id,
        parentPhone: parent?.phone,
        studentId,
        payload: {
          title: "Pickup Confirmed",
          body: `${studentName} was picked up by ${collectedBy} at ${time}.`,
          url: "/parent/dashboard",
          icon: "/icon-192.png",
        },
        smsText:
          `VerifyGate: ${studentName} was picked up by ${collectedBy} at ${time} from ${schoolName}. ` +
          `If this was not authorised, call the school immediately!`,
      });
    }

    return NextResponse.json(log, { status: 201 });
  } catch (err: any) {
    console.error("[confirm] unexpected error:", err?.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
