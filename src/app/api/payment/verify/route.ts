import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { settlePayment } from "@/lib/payments";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId || (session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });

  // The reference must belong to this school, not be replayed from another tenant
  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("id")
    .eq("reference", reference)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!payment) return NextResponse.json({ error: "Reference does not match this school" }, { status: 403 });

  try {
    const result = await settlePayment(reference);
    if (result === "paid") {
      const { data: school } = await supabaseAdmin.from("schools").select("paid_until").eq("id", schoolId).single();
      return NextResponse.json({ status: "paid", paidUntil: school?.paid_until ?? null });
    }
    if (result === "failed") {
      // e.g. "paystack:failed: Insufficient funds" -> "Insufficient funds"
      const { data: failed } = await supabaseAdmin.from("payments").select("failure_reason").eq("reference", reference).maybeSingle();
      const reason = (failed?.failure_reason ?? "").replace(/^paystack:\w+:?\s*|^init:\s*/i, "").trim();
      return NextResponse.json({ status: "failed", reason: reason && !/^mismatch/i.test(reason) ? reason : null });
    }
    return NextResponse.json({ status: "pending" });
  } catch (err: any) {
    console.error("[payment/verify]", err.message);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
