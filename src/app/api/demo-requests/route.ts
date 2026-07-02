import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { school_name, contact_name, email, phone, message, plan } = body;

  if (!school_name || !contact_name || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

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

  return NextResponse.json({ ok: true });
}
