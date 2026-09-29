import { NextRequest, NextResponse } from "next/server";
import { runSubscriptionJobs } from "@/lib/jobs";

// Daily safety net (vercel.json). The same jobs normally run from app traffic
// via scheduleBackgroundJobs(); this covers days with no traffic at all.
// Vercel sends "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSubscriptionJobs({ force: true });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[cron/daily]", err?.message);
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}
