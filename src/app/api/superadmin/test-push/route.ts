import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import webpush from "web-push";

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? "hello@verifygate.app"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!process.env.VAPID_PUBLIC_KEY) {
    return NextResponse.json({ error: "VAPID_PUBLIC_KEY not set in environment" }, { status: 500 });
  }

  const { parentId } = await req.json().catch(() => ({}));

  // If no parentId, get the first parent with a push subscription
  let query = supabaseAdmin.from("push_subscriptions").select("parent_id, endpoint, subscription_json").limit(1);
  if (parentId) query = query.eq("parent_id", parentId);

  const { data: subs, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subs?.length) return NextResponse.json({ error: "No push subscriptions found. Has a parent logged in and granted permission?" }, { status: 404 });

  const sub = subs[0];
  try {
    await webpush.sendNotification(
      sub.subscription_json,
      JSON.stringify({
        title: "Test Push - VerifyGate",
        body: "Push notifications are working correctly!",
        url: "/parent/dashboard",
        icon: "/icon-192.png",
      })
    );
    return NextResponse.json({ ok: true, endpoint: sub.endpoint.slice(0, 40) + "..." });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Push failed", statusCode: err?.statusCode }, { status: 500 });
  }
}
