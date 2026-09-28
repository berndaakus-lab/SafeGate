import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseBody } from "@/lib/validate";
import { deleteSchoolLogoFile, logoDataUrl, uploadSchoolLogo } from "@/lib/school-logo";

const schema = z.object({ logoData: logoDataUrl });

async function authorize() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.role === "superadmin";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorize())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = await parseBody(req, schema);
  if (parsed.error) return parsed.error;

  const { data: school } = await supabaseAdmin.from("schools").select("logo_url").eq("id", id).maybeSingle();
  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

  try {
    const logoUrl = await uploadSchoolLogo(id, parsed.data.logoData);
    const { error } = await supabaseAdmin.from("schools").update({ logo_url: logoUrl }).eq("id", id);
    if (error) {
      await deleteSchoolLogoFile(logoUrl);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await deleteSchoolLogoFile(school.logo_url);
    return NextResponse.json({ logoUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Logo upload failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorize())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data: school } = await supabaseAdmin.from("schools").select("logo_url").eq("id", id).maybeSingle();
  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

  const { error } = await supabaseAdmin.from("schools").update({ logo_url: null }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await deleteSchoolLogoFile(school.logo_url);
  return NextResponse.json({ ok: true });
}
