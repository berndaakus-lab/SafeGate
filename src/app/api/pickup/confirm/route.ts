import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendNotification } from "@/lib/notifications";
import { parseBody } from "@/lib/validate";
import { joinNames, loadPickupCode } from "@/lib/pickup-codes";

// studentId (single) is still accepted from verify pages that were already
// open in a guard's browser when this version was deployed.
const schema = z
  .object({
    pickupCodeId: z.string().uuid(),
    studentIds: z.array(z.string().uuid()).max(20).optional(),
    studentId: z.string().uuid().optional(),
  })
  .transform(({ pickupCodeId, studentIds, studentId }) => ({
    pickupCodeId,
    studentIds: [...new Set(studentIds ?? (studentId ? [studentId] : []))],
  }))
  .refine((v) => v.studentIds.length > 0, { message: "Select at least one child to confirm.", path: ["studentIds"] });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const guardSchoolId = (session?.user as any)?.schoolId;
    // School admins can cover the gate too; the superadmin has no school
    if (!session || !["guard", "teacher", "admin"].includes(role) || !guardSchoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { pickupCodeId, studentIds } = parsed.data;

    const [loaded, { data: school }] = await Promise.all([
      loadPickupCode({ id: pickupCodeId }),
      supabaseAdmin.from("schools").select("is_active").eq("id", guardSchoolId).maybeSingle(),
    ]);
    if (school?.is_active === false) {
      return NextResponse.json({ error: "This school's VerifyGate account is offline. Contact the VerifyGate team." }, { status: 403 });
    }
    if (!loaded) return NextResponse.json({ error: "Pickup code not found." }, { status: 404 });
    const { pickupCode, children } = loaded;

    if (new Date() > new Date(pickupCode.expiresAt)) {
      return NextResponse.json({ error: "This code has expired. Ask the parent to generate a new one." }, { status: 410 });
    }

    const selected = studentIds.map((id) => children.find((c) => c.id === id));
    if (selected.some((c) => !c)) {
      return NextResponse.json({ error: "One of the selected children is not on this pickup code." }, { status: 400 });
    }
    if (selected.some((c) => c!.school_id !== guardSchoolId)) {
      return NextResponse.json({ error: "Code does not belong to your school" }, { status: 403 });
    }
    const alreadyPicked = selected.filter((c) => c!.pickedUpAt);
    if (alreadyPicked.length) {
      return NextResponse.json(
        { error: `${joinNames(alreadyPicked.map((c) => c!.name))} already picked up. Refresh the page.` },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin.from("pickup_logs").insert(
      selected.map((c) => ({
        pickup_code_id: pickupCode.id,
        student_id: c!.id,
        authorized_person_id: pickupCode.authorizedPersonId,
        confirmed_by_staff_id: (session.user as any).id,
        confirmed_by_name: session.user?.name ?? null,
        confirmed_by_role: role,
      }))
    );

    if (error) {
      // Unique (pickup_code_id, student_id): another device confirmed first
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already picked up on another device. Refresh the page." }, { status: 409 });
      }
      console.error("[confirm] insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const remaining = children.filter((c) => !c.pickedUpAt && !studentIds.includes(c.id));

    // One notification per confirmation, however many children, so a parent
    // collecting three children gets one SMS instead of three.
    const time = new Date().toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" });
    const names = joinNames(selected.map((c) => c!.name));
    const collectedBy = pickupCode.authorizedPerson?.name ?? "an authorised person";
    const schoolName = loaded.school?.name ?? "school";
    const verb = selected.length > 1 ? "were" : "was";

    // The pickup is already logged, so reply to the gate straight away and
    // deliver push/SMS after the response. SMS retries can take seconds and
    // must not keep the guard waiting; after() keeps the function alive
    // until this finishes.
    after(async () => {
      if (remaining.length === 0) {
        await supabaseAdmin.from("pickup_codes").update({ used_at: new Date().toISOString() }).eq("id", pickupCode.id);
      }
      await sendNotification({
        parentId: pickupCode.parentId,
        parentPhone: pickupCode.parent?.phone ?? undefined,
        studentId: selected[0]!.id,
        payload: {
          title: "Pickup Confirmed",
          body: `${names} ${verb} picked up by ${collectedBy} at ${time}.`,
          url: "/parent/dashboard",
          icon: "/icon-192.png",
        },
        smsText:
          `VerifyGate: ${names} ${verb} picked up by ${collectedBy} at ${time} from ${schoolName}. ` +
          `If this was not authorised, call the school immediately!`,
      });
    });

    return NextResponse.json({ confirmed: selected.length, remaining: remaining.length }, { status: 201 });
  } catch (err: any) {
    console.error("[confirm] unexpected error:", err?.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
