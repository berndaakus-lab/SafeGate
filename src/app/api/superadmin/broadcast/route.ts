import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcastToSchool } from "@/lib/notifications";
import type { NotificationPayload } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { schoolId, title, body } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 });
  }

  const payload: NotificationPayload = {
    title,
    body,
    url: "/parent/dashboard",
    icon: "/icon-192.png",
  };

  if (schoolId) {
    // Single school broadcast
    await broadcastToSchool({ schoolId, payload });
    const { count } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .in(
        "parent_id",
        (await supabaseAdmin.from("parents").select("id").eq("school_id", schoolId)).data?.map((p: any) => p.id) ?? []
      );
    return NextResponse.json({ sent: count ?? 0 });
  }

  // All schools broadcast
  const { data: schools } = await supabaseAdmin
    .from("schools")
    .select("id")
    .eq("is_active", true);

  if (!schools?.length) return NextResponse.json({ sent: 0 });

  let totalSent = 0;
  for (const school of schools) {
    const { data: parents } = await supabaseAdmin
      .from("parents")
      .select("id")
      .eq("school_id", school.id);
    if (!parents?.length) continue;

    const { count } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .in("parent_id", parents.map((p: any) => p.id));

    await broadcastToSchool({ schoolId: school.id, payload });
    totalSent += count ?? 0;
  }

  return NextResponse.json({ sent: totalSent });
}
