import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";

const schema = z.object({
  moves: z
    .array(
      z.object({
        from: z.string().trim().min(1).max(100),
        to: z.string().trim().min(1, "Enter the new class.").max(100, "That class name is too long."),
      })
    )
    .min(1)
    .max(200),
});

// School admin: move whole classes up in one go (e.g. at the start of a year).
// Every move is worked out from each child's class as it is right now, so
// "3A to 4A" and "4A to 5A" can be applied together without 3A children ending
// up in 5A.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const schoolId = (session?.user as any)?.schoolId;
    if ((session?.user as any)?.role !== "admin" || !schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;

    const target = new Map<string, string>();
    for (const { from, to } of parsed.data.moves) {
      if (target.has(from)) return NextResponse.json({ error: `"${from}" appears twice.` }, { status: 400 });
      if (from !== to) target.set(from, to);
    }
    if (!target.size) return NextResponse.json({ moved: 0 });

    const { data: students, error } = await supabaseAdmin
      .from("students")
      .select("id, class_name")
      .eq("school_id", schoolId)
      .is("archived_at", null)
      .in("class_name", [...target.keys()]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const byNewClass = new Map<string, string[]>();
    for (const s of students ?? []) {
      const to = target.get(s.class_name as string);
      if (!to) continue;
      byNewClass.set(to, [...(byNewClass.get(to) ?? []), s.id]);
    }

    let moved = 0;
    for (const [to, ids] of byNewClass) {
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        const { error: updateError } = await supabaseAdmin
          .from("students")
          .update({ class_name: to })
          .eq("school_id", schoolId)
          .in("id", chunk);
        if (updateError) {
          return NextResponse.json({ error: updateError.message, moved }, { status: 500 });
        }
        moved += chunk.length;
      }
    }
    return NextResponse.json({ moved });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
