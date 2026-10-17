import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";

const schema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(30).optional().nullable(),
  relation: z.string().trim().max(100).optional().nullable(),
});

const updateSchema = schema.extend({ id: z.string().uuid() });

// Parent: fix a pickup person's details. The name is locked once that person
// has collected a child, so the school's pickup records stay accurate (a
// different person should be added as a new pickup person instead).
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const parentId = (session?.user as any)?.id;
    if ((session?.user as any)?.role !== "parent" || !parentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, updateSchema);
    if (parsed.error) return parsed.error;
    const { id, name, phone, relation } = parsed.data;

    const { data: person } = await supabaseAdmin
      .from("authorized_persons")
      .select("name")
      .eq("id", id)
      .eq("parent_id", parentId)
      .maybeSingle();
    if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

    if (name !== person.name) {
      const { count } = await supabaseAdmin
        .from("pickup_codes")
        .select("id", { count: "exact", head: true })
        .eq("authorized_person_id", id)
        .not("used_at", "is", null);
      if ((count ?? 0) > 0) {
        return NextResponse.json(
          { error: "This person has already collected a child, so their name can't be changed. Add them as a new person instead." },
          { status: 409 }
        );
      }
    }

    const { error } = await supabaseAdmin
      .from("authorized_persons")
      .update({ name, phone: phone || null, relation: relation || null })
      .eq("id", id)
      .eq("parent_id", parentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const parentId = (session?.user as any)?.id;
    if ((session?.user as any)?.role !== "parent" || !parentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { name, phone, relation } = parsed.data;

    const { data, error } = await supabaseAdmin
      .from("authorized_persons")
      .insert({ name, phone: phone || null, relation: relation || null, parent_id: parentId })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
