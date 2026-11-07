import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { newPassToken, passQrDataUrl, standingPassUrl, todayUtc } from "@/lib/pickup-pass";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const schema = z.object({
  personId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).min(1, "Choose at least one child.").max(20),
  // null = until the parent cancels
  until: z.string().regex(DATE).nullable(),
  schoolDays: z.boolean(),
});

async function parentId() {
  const session = await getServerSession(authOptions);
  const id = (session?.user as any)?.id as string | undefined;
  return (session?.user as any)?.role === "parent" && id ? id : null;
}

// Parent: turn on (or change) the standing pass for one of their pickup people
export async function POST(req: NextRequest) {
  try {
    const pid = await parentId();
    if (!pid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { personId, until, schoolDays } = parsed.data;
    const studentIds = [...new Set(parsed.data.studentIds)];

    if (until) {
      const max = new Date();
      max.setUTCFullYear(max.getUTCFullYear() + 2);
      if (until < todayUtc()) return NextResponse.json({ error: "Choose a date that has not passed." }, { status: 400 });
      if (until > max.toISOString().slice(0, 10)) return NextResponse.json({ error: "Choose a date within the next two years." }, { status: 400 });
    }

    const [{ data: person }, { data: students }] = await Promise.all([
      supabaseAdmin
        .from("authorized_persons")
        .select("id, name, photo_url, phone, relation, standing_token")
        .eq("id", personId)
        .eq("parent_id", pid)
        .maybeSingle(),
      supabaseAdmin.from("students").select("id").in("id", studentIds).eq("parent_id", pid).is("archived_at", null),
    ]);
    if (!person) return NextResponse.json({ error: "Person not found on your account." }, { status: 404 });
    // A driver's phone number is what lets one scan cover every family they serve
    if (person.relation === "Driver" && !person.phone) {
      return NextResponse.json({ error: `Add ${person.name}'s phone number first. It lets one scan cover every family the driver serves.` }, { status: 400 });
    }
    if ((students ?? []).length !== studentIds.length) {
      return NextResponse.json({ error: "One of the selected children was not found on your account." }, { status: 404 });
    }

    const firstTime = !person.standing_token;
    let token = person.standing_token as string | null;
    for (let attempt = 0; attempt < 5; attempt++) {
      if (token) break;
      const candidate = newPassToken();
      const { data: set, error } = await supabaseAdmin
        .from("authorized_persons")
        .update({ standing_token: candidate })
        .eq("id", personId)
        .eq("parent_id", pid)
        .is("standing_token", null)
        .select("standing_token");
      if (!error) {
        if (set?.length) {
          token = candidate;
        } else {
          // Another device turned it on a moment ago: use the token it made
          const { data: current } = await supabaseAdmin.from("authorized_persons").select("standing_token").eq("id", personId).eq("parent_id", pid).maybeSingle();
          token = current?.standing_token ?? null;
        }
        break;
      }
      if (error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!token) return NextResponse.json({ error: "Could not create the pass. Please try again." }, { status: 500 });

    const { error: updateError } = await supabaseAdmin
      .from("authorized_persons")
      .update({
        standing_until: until,
        standing_school_days: schoolDays,
        ...(firstTime ? { standing_started_at: new Date().toISOString() } : {}),
      })
      .eq("id", personId)
      .eq("parent_id", pid);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    await supabaseAdmin.from("standing_pass_children").delete().eq("person_id", personId);
    const { error: linkError } = await supabaseAdmin
      .from("standing_pass_children")
      .insert(studentIds.map((student_id) => ({ person_id: personId, student_id })));
    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });

    return NextResponse.json({ token, url: standingPassUrl(token), qrUrl: await passQrDataUrl(token) });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Parent: cancel a standing pass. The code stops working at once; turning it on
// again later makes a new one, so any old copy that was shared stays dead.
export async function DELETE(req: NextRequest) {
  try {
    const pid = await parentId();
    if (!pid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = await parseBody(req, z.object({ personId: z.string().uuid() }));
    if (parsed.error) return parsed.error;

    const { data, error } = await supabaseAdmin
      .from("authorized_persons")
      .update({ standing_token: null, standing_until: null, standing_school_days: false, standing_started_at: null })
      .eq("id", parsed.data.personId)
      .eq("parent_id", pid)
      .select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) return NextResponse.json({ error: "Person not found on your account." }, { status: 404 });

    await supabaseAdmin.from("standing_pass_children").delete().eq("person_id", parsed.data.personId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
