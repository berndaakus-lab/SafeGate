import { NextRequest, NextResponse, after } from "next/server";
import { notifyNewLead } from "@/lib/lead-alerts";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { sendDemoConfirmationEmail } from "@/lib/email";
import { parseBody } from "@/lib/validate";

const schema = z.object({
  school_name: z.string().trim().min(1).max(200),
  contact_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().nullable(),
  message: z.string().trim().max(2000).optional().nullable(),
  plan: z.string().trim().max(50).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, schema);
  if (parsed.error) return parsed.error;
  const { school_name, contact_name, email, phone, message, plan } = parsed.data;

  const { error } = await supabaseAdmin.from("demo_requests").insert({
    school_name,
    contact_name,
    email,
    phone: phone || null,
    message: message || null,
    plan: plan || null,
  });

  if (error) {
    console.error("[demo-requests]", error.message);
    return NextResponse.json({ error: "Failed to save request" }, { status: 500 });
  }

  // Tell the team in the background; the visitor never waits on this
  after(() =>
    notifyNewLead({ schoolName: school_name, contactName: contact_name, phone: phone || null, email }).catch((err) =>
      console.error("[demo-requests] lead alert failed:", err?.message)
    )
  );

  try {
    await sendDemoConfirmationEmail({ to: email, contactName: contact_name, schoolName: school_name });
  } catch (err: any) {
    console.error("[demo-requests] confirmation email failed:", err.message);
  }

  return NextResponse.json({ ok: true });
}
