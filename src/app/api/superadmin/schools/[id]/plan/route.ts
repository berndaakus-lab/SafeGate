import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";

const schema = z.object({
  plan: z.enum(["trial", "standard", "growth", "premier", "international", "school"]),
  trial_ends_at: z.string().datetime().optional().nullable(),
  max_students: z.number().int().min(0).max(1_000_000).optional().nullable(),
  custom_price: z.number().min(0).optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = await parseBody(req, schema);
  if (parsed.error) return parsed.error;
  const { plan, trial_ends_at, max_students, custom_price } = parsed.data;

  const { error } = await supabaseAdmin
    .from("schools")
    .update({ plan, trial_ends_at, max_students, custom_price: custom_price ?? null })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
