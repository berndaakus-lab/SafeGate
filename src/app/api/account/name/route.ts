import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { requiredName } from "@/lib/identity";

// Parent: correct their own name (the school may have entered only a surname).
// Children's names and classes stay with the school.
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const parentId = (session?.user as any)?.id;
    if ((session?.user as any)?.role !== "parent" || !parentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, z.object({ name: requiredName }));
    if (parsed.error) return parsed.error;

    const { error } = await supabaseAdmin.from("parents").update({ name: parsed.data.name }).eq("id", parentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
