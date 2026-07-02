import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

function detectNetwork(phone: string) {
  const prefix = phone.replace(/\s/g, "").slice(0, 3);
  const mtn = ["024", "054", "055", "059", "025"];
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
  const userEmail = (session?.user as any)?.email;
  const userName = (session?.user as any)?.name;

  if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phone, amount_ghs } = await req.json();
  if (!phone || !amount_ghs) return NextResponse.json({ error: "Missing phone or amount" }, { status: 400 });

  const cleanPhone = phone.replace(/\s/g, "");
  if (cleanPhone.length !== 10) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });

  const network = detectNetwork(cleanPhone);
  const pesewas = Math.round(parseFloat(amount_ghs) * 100);
  const reference = `SGT-${schoolId.slice(0, 8)}-${Date.now()}`;
  const email = userEmail || `${cleanPhone}@verifygate.app`;

  try {
    const paystackRes = await fetch("https://api.paystack.co/charge", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: pesewas,
        email,
        currency: "GHS",
        mobile_money: { phone: cleanPhone, provider: network },
        reference,
        metadata: {
          school_id: schoolId,
          customer_name: userName,
          custom_fields: [
            { display_name: "School ID", variable_name: "school_id", value: schoolId },
            { display_name: "Customer", variable_name: "customer_name", value: userName ?? "" },
          ],
        },
      }),
    });

    const data = await paystackRes.json();
    if (!data.status) throw new Error(data.message || "Paystack charge failed");

    // Store reference on school record
    await supabaseAdmin
      .from("schools")
      .update({ paystack_reference: reference })
      .eq("id", schoolId);

    return NextResponse.json({
      ok: true,
      reference,
      message: data.data?.display_text || "Payment prompt sent to your phone.",
    });
  } catch (err: any) {
    console.error("[payment/initialize]", err.message);
    return NextResponse.json({ error: err.message || "Payment initiation failed" }, { status: 500 });
  }
}
