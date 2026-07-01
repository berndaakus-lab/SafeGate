import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const rows = Object.entries(data).map(([key, value]) => ({ key, value: String(value ?? "") }));

    const { error } = await supabaseAdmin
      .from("settings")
      .upsert(rows, { onConflict: "key" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
