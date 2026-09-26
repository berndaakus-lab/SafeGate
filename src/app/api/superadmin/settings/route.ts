import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";

// Settings is a free-form key/value bag by design; still cap sizes to stop abuse.
const schema = z.record(
  z.string().min(1).max(100),
  z.union([z.string().max(2000), z.number(), z.boolean(), z.null()])
);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const data = parsed.data;
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
