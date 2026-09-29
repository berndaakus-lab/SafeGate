import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { getSettings } from "@/lib/settings";
import { BILLING_PERIODS, monthlyPriceGhs, periodPriceGhs, tierOf, toPesewas, type BillingMonths } from "@/lib/subscription";

// The browser only chooses the period; the amount is always worked out here
// from the school's agreed/tier price, so it can't be tampered with.
const schema = z.object({
  phone: z.string().trim().min(1, "Enter your MoMo number.").max(20),
  months: z.number().int().refine((m) => (BILLING_PERIODS as readonly number[]).includes(m), "Choose 1, 3, 6 or 12 months."),
});

function detectNetwork(phone: string) {
  const prefix = phone.slice(0, 3);
  const mtn = ["024", "054", "055", "059", "025", "053"];
  const vodafone = ["020", "050"];
  const airteltigo = ["027", "057", "026", "056", "023", "028"];
  if (mtn.includes(prefix)) return "mtn";
  if (vodafone.includes(prefix)) return "vod";
  if (airteltigo.includes(prefix)) return "tgo";
  return "mtn";
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;
  const role = (session?.user as any)?.role;
  if (!schoolId || role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, schema);
  if (parsed.error) return parsed.error;
  const months = parsed.data.months as BillingMonths;

  // Accept 0244123456, 233244123456, +233 24 412 3456 -> 0244123456
  let cleanPhone = parsed.data.phone.replace(/\D/g, "");
  if (cleanPhone.startsWith("233")) cleanPhone = "0" + cleanPhone.slice(3);
  if (cleanPhone.length === 9) cleanPhone = "0" + cleanPhone;
  if (cleanPhone.length !== 10) {
    return NextResponse.json({ error: "Enter a valid MoMo number, e.g. 0244123456.", fields: { phone: "Enter a valid MoMo number, e.g. 0244123456." } }, { status: 400 });
  }

  const [{ data: school }, settings] = await Promise.all([
    supabaseAdmin.from("schools").select("plan, custom_price").eq("id", schoolId).single(),
    getSettings(),
  ]);
  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

  const monthly = monthlyPriceGhs(school, settings);
  if (!monthly) {
    return NextResponse.json({ error: "Your school's price hasn't been set yet. Contact VerifyGate to arrange payment." }, { status: 409 });
  }
  const amountPesewas = toPesewas(periodPriceGhs(monthly, months));
  const tier = tierOf(school.plan);
  const reference = `SGT-${schoolId.slice(0, 8)}-${Date.now()}`;
  const email = (session?.user as any)?.email || `${cleanPhone}@verifygate.app`;
  const userName = (session?.user as any)?.name ?? "";

  // Record what we expect before asking Paystack, so verification can check it
  const { error: insertError } = await supabaseAdmin.from("payments").insert({
    school_id: schoolId,
    reference,
    months,
    tier,
    amount_pesewas: amountPesewas,
    currency: "GHS",
  });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  try {
    const paystackRes = await fetch("https://api.paystack.co/charge", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPesewas,
        email,
        currency: "GHS",
        mobile_money: { phone: cleanPhone, provider: detectNetwork(cleanPhone) },
        reference,
        metadata: {
          school_id: schoolId,
          months,
          customer_name: userName,
          custom_fields: [
            { display_name: "School ID", variable_name: "school_id", value: schoolId },
            { display_name: "Period", variable_name: "months", value: `${months} month(s)` },
            { display_name: "Customer", variable_name: "customer_name", value: userName },
          ],
        },
      }),
    });

    const data = await paystackRes.json();
    if (!data.status) throw new Error(data.message || "Paystack charge failed");

    return NextResponse.json({
      ok: true,
      reference,
      message: data.data?.display_text || "Payment prompt sent to your phone.",
    });
  } catch (err: any) {
    await supabaseAdmin.from("payments").update({ status: "failed", failure_reason: `init: ${err.message}` }).eq("reference", reference);
    console.error("[payment/initialize]", err.message);
    return NextResponse.json({ error: err.message || "Payment initiation failed" }, { status: 500 });
  }
}
