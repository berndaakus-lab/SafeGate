import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { plan, trial_ends_at, max_students, custom_price } = await req.json();

  const { error } = await supabaseAdmin
    .from("schools")
    .update({ plan, trial_ends_at, max_students, custom_price: custom_price ?? null })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
