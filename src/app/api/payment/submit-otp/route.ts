import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";

// Sends the code the network texted (Paystack status "send_otp") to finish a MoMo charge
const schema = z.object({
  reference: z.string().trim().min(1).max(100),
  otp: z.string().trim().min(3, "Enter the code from the SMS.").max(12),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;
  if (!schoolId || (session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, schema);
  if (parsed.error) return parsed.error;
  const { reference, otp } = parsed.data;

  // Only this school's own pending payment
  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("id")
    .eq("reference", reference)
    .eq("school_id", schoolId)
    .eq("status", "pending")
    .maybeSingle();
  if (!payment) return NextResponse.json({ error: "This payment is no longer waiting for a code. Start again." }, { status: 404 });

  try {
    const res = await fetch("https://api.paystack.co/charge/submit_otp", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ otp, reference }),
    });
    const body = await res.json().catch(() => null);
    const status: string | undefined = body?.data?.status;
    if (!body?.status || status === "failed") {
      const reason = body?.data?.message || body?.data?.gateway_response || body?.message;
      console.error("[payment/submit-otp]", { reference, status, reason });
      return NextResponse.json({ error: reason && reason !== "Charge attempted" ? reason : "That code didn't work. Check it and try again." }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      status,
      message: body?.data?.display_text || "Code accepted. Approve the prompt on your phone if one appears.",
    });
  } catch (err: any) {
    console.error("[payment/submit-otp]", err.message);
    return NextResponse.json({ error: "Could not reach the payment service. Please try again." }, { status: 502 });
  }
}
