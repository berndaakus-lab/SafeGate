import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";

// Parent: choose the person who usually collects (or none), for the one-tap daily code
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const parentId = (session?.user as any)?.id as string | undefined;
    if ((session?.user as any)?.role !== "parent" || !parentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, z.object({ personId: z.string().uuid().nullable() }));
    if (parsed.error) return parsed.error;
    const { personId } = parsed.data;

    if (personId) {
      const { data: person } = await supabaseAdmin
        .from("authorized_persons")
        .select("id")
        .eq("id", personId)
        .eq("parent_id", parentId)
        .maybeSingle();
      if (!person) return NextResponse.json({ error: "Person not found on your account." }, { status: 404 });
    }

    const { error: clearError } = await supabaseAdmin.from("authorized_persons").update({ is_usual: false }).eq("parent_id", parentId);
    if (clearError) return NextResponse.json({ error: clearError.message }, { status: 500 });
    if (personId) {
      const { error } = await supabaseAdmin.from("authorized_persons").update({ is_usual: true }).eq("id", personId).eq("parent_id", parentId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
