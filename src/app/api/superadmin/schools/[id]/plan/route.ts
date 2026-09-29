import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";

// "trial" means no tier chosen yet (priced as Growth). Trial end and paid-until
// dates are independent of the tier: paid_until can be set by hand to record
// a cash/WhatsApp payment made outside the MoMo checkout.
const schema = z.object({
  plan: z.enum(["trial", "standard", "growth", "premier", "international"], "Choose a plan."),
  trial_ends_at: z.string().datetime().optional().nullable(),
  paid_until: z.string().datetime().optional().nullable(),
  max_students: z.number().int().min(1, "Max students must be at least 1.").max(1_000_000).optional().nullable(),
  custom_price: z.number().min(0, "Price can't be negative.").optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = await parseBody(req, schema);
  if (parsed.error) return parsed.error;
  const { plan, trial_ends_at, paid_until, max_students, custom_price } = parsed.data;

  const { error } = await supabaseAdmin
    .from("schools")
    .update({
      plan,
      trial_ends_at: trial_ends_at ?? null,
      paid_until: paid_until ?? null,
      max_students,
      custom_price: custom_price ?? null,
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
