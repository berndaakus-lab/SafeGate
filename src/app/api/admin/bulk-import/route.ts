import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { escapeLike, isEmailIdentifier, normalizeEmail, normalizePhone } from "@/lib/identity";

const schema = z.object({
  schoolId: z.string().uuid(),
  studentName: z.string().trim().min(1).max(200),
  className: z.string().trim().max(100).optional().nullable(),
  parentLogin: z.string().trim().min(1).max(255),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionSchoolId = (session?.user as any)?.schoolId;
    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { schoolId, studentName, className, parentLogin } = parsed.data;
    if (schoolId !== sessionSchoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // The CSV column accepts either the parent's email or their login phone
    let q = supabaseAdmin.from("parents").select("id").eq("school_id", schoolId);
    if (isEmailIdentifier(parentLogin)) {
      q = q.ilike("email", escapeLike(normalizeEmail(parentLogin)!));
    } else {
      const phone = normalizePhone(parentLogin);
      if (!phone) return NextResponse.json({ error: `Invalid parent email or phone: ${parentLogin}` }, { status: 400 });
      q = q.eq("login_phone", phone);
    }
    const { data: parent } = await q.maybeSingle();

    if (!parent) {
      return NextResponse.json(
        { error: `No parent account found for ${parentLogin}` },
        { status: 404 }
      );
    }

    const { error } = await supabaseAdmin.from("students").insert({
      name: studentName,
      class_name: className || null,
      parent_id: parent.id,
      school_id: schoolId,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
