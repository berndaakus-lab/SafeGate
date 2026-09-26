import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });

  try {
    // Confirm this reference was actually issued to this school, not replayed from another tenant
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("plan, paid_at, paystack_reference")
      .eq("id", schoolId)
      .single();

    if (!school || school.paystack_reference !== reference) {
      return NextResponse.json({ error: "Reference does not match this school" }, { status: 403 });
    }

    const paystackRes = await fetch(`https://api.paystack.co/charge/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const data = await paystackRes.json();
    const status = data?.data?.status;

    if (status === "success") {
      if (school && school.plan !== "school") {
        await supabaseAdmin
          .from("schools")
          .update({
            plan: "school",
            trial_ends_at: null,
            paid_at: new Date().toISOString(),
          })
          .eq("id", schoolId);
      }

      return NextResponse.json({ status: "paid" });
    }

    if (status === "failed") {
      return NextResponse.json({ status: "failed" });
    }

    return NextResponse.json({ status: "pending", paystackStatus: status });
  } catch (err: any) {
    console.error("[payment/verify]", err.message);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
