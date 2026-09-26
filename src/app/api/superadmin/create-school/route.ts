import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, isReservedSuperadminEmail } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import bcrypt from "bcryptjs";

const schema = z.object({
  school: z.object({
    name: z.string().trim().min(1).max(200),
    address: z.string().trim().max(500).optional().nullable(),
    phone: z.string().trim().max(30).optional().nullable(),
  }),
  admin: z.object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(255),
    password: z.string().min(8).max(200),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { school, admin } = parsed.data;

    if (isReservedSuperadminEmail(admin.email)) {
      return NextResponse.json({ error: "That email is reserved for the platform superadmin account. Use a different email for this school's admin." }, { status: 409 });
    }

    // Check email not already taken
    const { data: existing } = await supabaseAdmin
      .from("staff")
      .select("id")
      .eq("email", admin.email)
      .single();

    if (existing) {
      return NextResponse.json({ error: "A staff account with that email already exists." }, { status: 409 });
    }

    // Create school with 30-day trial defaults
    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: newSchool, error: schoolError } = await supabaseAdmin
      .from("schools")
      .insert({
        name: school.name,
        address: school.address || null,
        phone: school.phone || null,
        plan: "trial",
        trial_ends_at: trialEndsAt,
        max_students: 100,
      })
      .select()
      .single();

    if (schoolError) return NextResponse.json({ error: schoolError.message }, { status: 500 });

    // Create first admin
    const hashedPassword = await bcrypt.hash(admin.password, 12);
    const { error: staffError } = await supabaseAdmin
      .from("staff")
      .insert({
        name: admin.name,
        email: admin.email,
        password: hashedPassword,
        role: "admin",
        school_id: newSchool.id,
      });

    if (staffError) {
      // Rollback school creation
      await supabaseAdmin.from("schools").delete().eq("id", newSchool.id);
      return NextResponse.json({ error: staffError.message }, { status: 500 });
    }

    return NextResponse.json({ school: newSchool }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
