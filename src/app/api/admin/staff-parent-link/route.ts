import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";

// School admin: mark a staff member as also being a parent at this school.
// The staff account stays the only sign-in; the parent profile that holds the
// children is linked to it and loses any login of its own, so there is one
// phone number and one password, and the person switches sides in the app.

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const schoolId = (session?.user as any)?.schoolId;
  if ((session?.user as any)?.role !== "admin" || !schoolId) return null;
  return schoolId as string;
}

// A password nobody knows: the linked parent profile is only reached through the staff sign-in
const unusablePassword = async () => bcrypt.hash(randomBytes(32).toString("hex"), 12);

const linkSchema = z.object({
  staffId: z.string().uuid(),
  // An existing parent to link; without it a new parent profile is made
  parentId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const schoolId = await requireAdmin();
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = await parseBody(req, linkSchema);
    if (parsed.error) return parsed.error;
    const { staffId, parentId } = parsed.data;

    const { data: staff } = await supabaseAdmin
      .from("staff")
      .select("id, name, login_phone")
      .eq("id", staffId)
      .eq("school_id", schoolId)
      .maybeSingle();
    if (!staff) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

    const { data: existing, error: lookupError } = await supabaseAdmin.from("parents").select("id").eq("staff_id", staffId).maybeSingle();
    if (lookupError) {
      return NextResponse.json({ error: "This feature needs a database update first. Contact VerifyGate." }, { status: 503 });
    }
    if (existing) return NextResponse.json({ error: `${staff.name} is already linked to a parent profile.` }, { status: 409 });

    if (parentId) {
      const { data: parent } = await supabaseAdmin
        .from("parents")
        .select("id, staff_id, phone, login_phone")
        .eq("id", parentId)
        .eq("school_id", schoolId)
        .maybeSingle();
      if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });
      if (parent.staff_id) return NextResponse.json({ error: "That parent is already linked to a staff member." }, { status: 409 });

      // Their parent sign-in ends: from now on they use the staff sign-in for both
      const { error } = await supabaseAdmin
        .from("parents")
        .update({
          staff_id: staffId,
          email: null,
          login_phone: null,
          password: await unusablePassword(),
          must_change_password: false,
          // Keep pickup alerts going somewhere: the old login phone, or the staff phone
          phone: parent.phone ?? parent.login_phone ?? staff.login_phone ?? null,
        })
        .eq("id", parentId)
        .eq("school_id", schoolId)
        .is("staff_id", null);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, parentId });
    }

    const { data: created, error } = await supabaseAdmin
      .from("parents")
      .insert({
        name: staff.name,
        email: null,
        login_phone: null,
        phone: staff.login_phone ?? null,
        password: await unusablePassword(),
        must_change_password: false,
        school_id: schoolId,
        staff_id: staffId,
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, parentId: created.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Unlink: the parent profile and its children stay, but it has no sign-in until
// the school gives it one (Edit on the Parents page). The staff side is untouched.
export async function DELETE(req: NextRequest) {
  try {
    const schoolId = await requireAdmin();
    if (!schoolId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = await parseBody(req, z.object({ staffId: z.string().uuid() }));
    if (parsed.error) return parsed.error;

    const { data, error } = await supabaseAdmin
      .from("parents")
      .update({ staff_id: null })
      .eq("staff_id", parsed.data.staffId)
      .eq("school_id", schoolId)
      .select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) return NextResponse.json({ error: "No link found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
