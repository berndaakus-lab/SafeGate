import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { fieldErrorResponse, parseBody } from "@/lib/validate";
import { findLoginConflict, newPassword, optionalEmail, optionalPhone, requiredName } from "@/lib/identity";
import { deleteSchoolLogoFile, logoDataUrl, uploadSchoolLogo } from "@/lib/school-logo";
import bcrypt from "bcryptjs";

const schema = z.object({
  school: z.object({
    name: z.string().trim().min(1, "Enter the school name.").max(200, "That name is too long."),
    address: z.string().trim().max(500, "That address is too long.").optional().nullable(),
    phone: optionalPhone,
    logoData: logoDataUrl.optional().nullable(),
  }),
  admin: z.object({
    name: requiredName,
    email: optionalEmail,
    loginPhone: optionalPhone,
    password: newPassword,
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

    const conflict = await findLoginConflict({ email: admin.email, loginPhone: admin.loginPhone });
    if (conflict) {
      return fieldErrorResponse(
        Object.fromEntries(Object.entries(conflict).map(([k, v]) => [`admin.${k}`, v])),
        409
      );
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
        login_phone: admin.loginPhone,
        password: hashedPassword,
        must_change_password: true,
        role: "admin",
        school_id: newSchool.id,
      });

    if (staffError) {
      // Rollback school creation
      await supabaseAdmin.from("schools").delete().eq("id", newSchool.id);
      return NextResponse.json({ error: staffError.message }, { status: 500 });
    }

    // The logo is optional: if its upload fails, keep the school and admin
    // and tell the caller, since it can be added later from the school page.
    let logoWarning: string | undefined;
    if (school.logoData) {
      let logoUrl: string | undefined;
      try {
        logoUrl = await uploadSchoolLogo(newSchool.id, school.logoData);
        const { error } = await supabaseAdmin.from("schools").update({ logo_url: logoUrl }).eq("id", newSchool.id);
        if (error) throw new Error(error.message);
        newSchool.logo_url = logoUrl;
      } catch (err: any) {
        if (logoUrl) await deleteSchoolLogoFile(logoUrl);
        console.error("[create-school] logo upload failed:", err?.message);
        logoWarning = "The school was created, but the logo could not be uploaded. Add it from the school's page.";
      }
    }

    return NextResponse.json({ school: newSchool, logoWarning }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
