import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { sendNotification } from "@/lib/notifications";
import { newApprovalToken } from "@/lib/pickup-pass";

const APPROVAL_MINUTES = 10;

async function guardSession() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const schoolId = (session?.user as any)?.schoolId as string | undefined;
  if (!session || !["guard", "teacher", "admin"].includes(role) || !schoolId) return null;
  return { schoolId, staffId: (session.user as any).id as string, name: (session.user?.name ?? null) as string | null };
}

// Guard: ask the parent to approve a person for today, by message
export async function POST(req: NextRequest) {
  try {
    const g = await guardSession();
    if (!g) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = await parseBody(req, z.object({ studentId: z.string().uuid(), personId: z.string().uuid() }));
    if (parsed.error) return parsed.error;
    const { studentId, personId } = parsed.data;

    const { data: student } = await supabaseAdmin
      .from("students")
      .select("id, name, parent_id, school_id")
      .eq("id", studentId)
      .eq("school_id", g.schoolId)
      .is("archived_at", null)
      .maybeSingle();
    if (!student?.parent_id) return NextResponse.json({ error: "Child not found at your school." }, { status: 404 });

    const [{ data: person }, { data: parent }, { data: school }] = await Promise.all([
      supabaseAdmin.from("authorized_persons").select("id, name").eq("id", personId).eq("parent_id", student.parent_id).maybeSingle(),
      supabaseAdmin.from("parents").select("id, phone, login_phone").eq("id", student.parent_id).maybeSingle(),
      supabaseAdmin.from("schools").select("name, is_active").eq("id", g.schoolId).maybeSingle(),
    ]);
    if (!person) return NextResponse.json({ error: "That person is not on this child's parent's list." }, { status: 404 });
    if (!parent) return NextResponse.json({ error: "Parent not found." }, { status: 404 });
    if (school?.is_active === false) return NextResponse.json({ error: "This school's VerifyGate account is offline." }, { status: 403 });

    const now = new Date();
    // Old unanswered requests are closed, so a new one can be made
    await supabaseAdmin.from("pickup_approvals").update({ status: "expired" }).eq("student_id", studentId).eq("status", "pending").lt("expires_at", now.toISOString());

    const { data: open } = await supabaseAdmin
      .from("pickup_approvals")
      .select("id, expires_at, authorized_person_id")
      .eq("student_id", studentId)
      .eq("status", "pending")
      .maybeSingle();
    if (open) {
      // Already asked a moment ago: wait for that answer, no second message to the parent
      return NextResponse.json({ id: open.id, expiresAt: open.expires_at, alreadyAsked: true });
    }

    // A guard can't flood parents with messages
    const { count } = await supabaseAdmin
      .from("pickup_approvals")
      .select("id", { count: "exact", head: true })
      .eq("requested_by", g.staffId)
      .gte("created_at", new Date(now.getTime() - 10 * 60_000).toISOString());
    if ((count ?? 0) >= 10) return NextResponse.json({ error: "Too many requests. Wait a few minutes." }, { status: 429 });

    const token = newApprovalToken();
    const expiresAt = new Date(now.getTime() + APPROVAL_MINUTES * 60_000).toISOString();
    const { data: created, error } = await supabaseAdmin
      .from("pickup_approvals")
      .insert({
        token,
        school_id: g.schoolId,
        parent_id: student.parent_id,
        student_id: studentId,
        authorized_person_id: personId,
        requested_by: g.staffId,
        requested_by_name: g.name,
        expires_at: expiresAt,
      })
      .select("id")
      .single();
    if (error) {
      // 23505: someone asked for this child a split second earlier
      if (error.code === "23505") return NextResponse.json({ error: "A request for this child is already waiting. Try again in a moment." }, { status: 409 });
      return NextResponse.json({ error: "Could not send the request." }, { status: 500 });
    }

    const link = `${process.env.NEXTAUTH_URL}/approve/${token}`;
    const schoolName = school?.name ?? "the school";
    after(async () => {
      await sendNotification({
        parentId: student.parent_id!,
        parentPhone: parent.phone ?? parent.login_phone ?? undefined,
        studentId,
        payload: {
          title: "Approve pickup?",
          body: `${person.name} is at the gate to collect ${student.name}. Tap to approve or decline.`,
          url: `/approve/${token}`,
          icon: "/icon-192.png",
        },
        smsText: `VerifyGate: ${person.name} is at the gate of ${schoolName} to collect ${student.name}. Approve or decline: ${link}`,
      });
    });

    return NextResponse.json({ id: created.id, expiresAt });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Guard: has the parent answered yet?
export async function GET(req: NextRequest) {
  const g = await guardSession();
  if (!g) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { data } = await supabaseAdmin
    .from("pickup_approvals")
    .select("status, expires_at, pickup_code_id, pickup_codes(code)")
    .eq("id", id)
    .eq("school_id", g.schoolId)
    .maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let status = data.status as string;
  if (status === "pending" && new Date(data.expires_at) < new Date()) status = "expired";
  const pc: any = Array.isArray(data.pickup_codes) ? data.pickup_codes[0] : data.pickup_codes;
  return NextResponse.json({ status, code: status === "approved" ? pc?.code ?? null : null });
}
