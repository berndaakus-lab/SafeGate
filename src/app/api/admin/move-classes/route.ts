import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { getSchoolClasses, resolveClass } from "@/lib/school-classes";

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

    const levels = await getSchoolClasses(schoolId);
    const target = new Map<string, { name: string; id: string | null }>();
    for (const { from, to } of parsed.data.moves) {
      if (target.has(from)) return NextResponse.json({ error: `"${from}" appears twice.` }, { status: 400 });
      const resolved = resolveClass(to, levels);
      if ("error" in resolved || !resolved.value) {
        return NextResponse.json({ error: "error" in resolved ? resolved.error : "Choose the new class." }, { status: 400 });
      }
      if (from !== resolved.value) target.set(from, { name: resolved.value, id: resolved.id });
    }
    if (!target.size) return NextResponse.json({ moved: 0 });

    const { data: students, error } = await supabaseAdmin
      .from("students")
      .select("id, class_name")
      .eq("school_id", schoolId)
      .is("archived_at", null)
      .in("class_name", [...target.keys()]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const byNewClass = new Map<string, { id: string | null; ids: string[] }>();
    for (const s of students ?? []) {
      const to = target.get(s.class_name as string);
      if (!to) continue;
      const group = byNewClass.get(to.name) ?? { id: to.id, ids: [] };
      group.ids.push(s.id);
      byNewClass.set(to.name, group);
    }

    let moved = 0;
    for (const [to, { id: levelId, ids }] of byNewClass) {
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        const { error: updateError } = await supabaseAdmin
          .from("students")
          .update({ class_name: to, class_id: levelId })
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
