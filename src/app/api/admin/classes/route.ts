import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { cleanClassName, ensureClass, getSchoolClasses } from "@/lib/school-classes";

async function adminSchool() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId as string | undefined;
  return (session?.user as any)?.role === "admin" && schoolId ? schoolId : null;
}

const className = z.string().trim().min(1, "Enter a class name.").max(100, "A class name can be 100 characters at most.");

// Add one or many classes (the Add box and the list import both use this).
// Names the school already has, in any spelling, are skipped.
export async function POST(req: NextRequest) {
  try {
    const schoolId = await adminSchool();
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = await parseBody(req, z.object({ names: z.array(className).min(1).max(300) }));
    if (parsed.error) return parsed.error;

    const classes = await getSchoolClasses(schoolId);
    let added = 0;
    for (const name of parsed.data.names) {
      const before = classes.length;
      const result = await ensureClass(schoolId, name, classes);
      if ("error" in result) return NextResponse.json({ error: result.error, added }, { status: 500 });
      if (classes.length > before) added++;
    }
    return NextResponse.json({ added, skipped: parsed.data.names.length - added });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Rename a class. Children in it show the new name straight away.
export async function PATCH(req: NextRequest) {
  try {
    const schoolId = await adminSchool();
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = await parseBody(req, z.object({ id: z.string().uuid(), name: className }));
    if (parsed.error) return parsed.error;
    const name = cleanClassName(parsed.data.name);

    const { error } = await supabaseAdmin
      .from("school_classes")
      .update({ name })
      .eq("id", parsed.data.id)
      .eq("school_id", schoolId);
    if (error) {
      const clash = error.code === "23505";
      return NextResponse.json(
        { error: clash ? `You already have a class called "${name}".` : error.message },
        { status: clash ? 409 : 500 }
      );
    }

    await supabaseAdmin
      .from("students")
      .update({ class_name: name })
      .eq("class_id", parsed.data.id)
      .eq("school_id", schoolId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Delete a class nobody is in. Move the children out first.
export async function DELETE(req: NextRequest) {
  try {
    const schoolId = await adminSchool();
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = await parseBody(req, z.object({ id: z.string().uuid() }));
    if (parsed.error) return parsed.error;

    const { count } = await supabaseAdmin
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("class_id", parsed.data.id)
      .eq("school_id", schoolId);
    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: `${count} child${count === 1 ? " is" : "ren are"} in this class (including archived). Move them to another class first.` },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin.from("school_classes").delete().eq("id", parsed.data.id).eq("school_id", schoolId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
