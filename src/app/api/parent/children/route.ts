import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  className: z.string().trim().max(100).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const parentId = (session?.user as any)?.id;
    const schoolId = (session?.user as any)?.schoolId;
    if (!session || (session.user as any)?.role !== "parent" || !parentId || !schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { name, className } = parsed.data;

    const { data, error } = await supabaseAdmin
      .from("students")
      .insert({ name, class_name: className || null, parent_id: parentId, school_id: schoolId })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
