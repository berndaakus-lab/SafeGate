import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import bcrypt from "bcryptjs";

// An admin may only create guard/teacher accounts, never admin or superadmin
// (privilege escalation guard).
const schema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(200),
  role: z.enum(["guard", "teacher"]).optional(),
  schoolId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionSchoolId = (session?.user as any)?.schoolId;
    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { name, email, password, role: staffRole, schoolId } = parsed.data;

    if (schoolId !== sessionSchoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: existing } = await supabaseAdmin.from("staff").select("id").eq("email", email).single();
    if (existing) return NextResponse.json({ error: "Email already in use." }, { status: 409 });

    const hashedPassword = await bcrypt.hash(password, 12);
    const { error } = await supabaseAdmin.from("staff").insert({
      name, email, password: hashedPassword,
      role: staffRole || "guard",
      school_id: schoolId,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
