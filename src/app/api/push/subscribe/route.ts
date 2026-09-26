import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";

const subscribeSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({ p256dh: z.string(), auth: z.string() }).optional(),
  expirationTime: z.number().nullable().optional(),
});

const unsubscribeSchema = z.object({ endpoint: z.string().url().max(2000) });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const parentId = (session?.user as any)?.id;
  if (!parentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, subscribeSchema);
  if (parsed.error) return parsed.error;
  const subscription = parsed.data;

  // Upsert, same endpoint may re-register
  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .upsert(
      { parent_id: parentId, endpoint: subscription.endpoint, subscription_json: subscription },
      { onConflict: "endpoint" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const parentId = (session?.user as any)?.id;
  if (!parentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, unsubscribeSchema);
  if (parsed.error) return parsed.error;
  const { endpoint } = parsed.data;

  // Only delete subscriptions that belong to the authenticated parent
  await supabaseAdmin
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("parent_id", parentId);
  return NextResponse.json({ ok: true });
}
