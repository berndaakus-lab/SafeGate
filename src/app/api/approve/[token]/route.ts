import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { APPROVAL_TOKEN, createLookupCode } from "@/lib/pickup-pass";

// Public: the parent answers from the link in their message. The link is long
// and random, works once, and stops working after ten minutes. Answering is the
// only thing it can do: it shows nothing else about the family.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (!APPROVAL_TOKEN.test(token)) return NextResponse.json({ error: "This link is not valid." }, { status: 404 });

    const parsed = await parseBody(req, z.object({ decision: z.enum(["approve", "decline"]) }));
    if (parsed.error) return parsed.error;
    const { decision } = parsed.data;

    const { data: approval } = await supabaseAdmin
      .from("pickup_approvals")
      .select("id, status, expires_at, parent_id, student_id, authorized_person_id")
      .eq("token", token)
      .maybeSingle();
    if (!approval) return NextResponse.json({ error: "This link is not valid." }, { status: 404 });
    if (approval.status !== "pending") {
      return NextResponse.json({ error: "This request has already been answered.", status: approval.status }, { status: 409 });
    }
    const now = new Date().toISOString();
    if (approval.expires_at < now) {
      await supabaseAdmin.from("pickup_approvals").update({ status: "expired" }).eq("id", approval.id).eq("status", "pending");
      return NextResponse.json({ error: "This request has expired.", status: "expired" }, { status: 410 });
    }

    // Take the answer first, so two taps (or a double click) can't both go through
    const { data: claimed } = await supabaseAdmin
      .from("pickup_approvals")
      .update({ status: decision === "approve" ? "approved" : "declined", decided_at: now })
      .eq("id", approval.id)
      .eq("status", "pending")
      .gt("expires_at", now)
      .select("id");
    if (!claimed?.length) return NextResponse.json({ error: "This request has already been answered." }, { status: 409 });

    if (decision === "decline") return NextResponse.json({ status: "declined" });

    const code = await createLookupCode({ parentId: approval.parent_id, studentId: approval.student_id, personId: approval.authorized_person_id });
    if (!code) {
      // Put it back so the parent can try again
      await supabaseAdmin.from("pickup_approvals").update({ status: "pending", decided_at: null }).eq("id", approval.id);
      return NextResponse.json({ error: "Could not approve. Please try again." }, { status: 500 });
    }
    await supabaseAdmin.from("pickup_approvals").update({ pickup_code_id: code.id }).eq("id", approval.id);
    return NextResponse.json({ status: "approved" });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
