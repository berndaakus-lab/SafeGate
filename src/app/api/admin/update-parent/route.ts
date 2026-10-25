import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { fieldErrorResponse, parseBody } from "@/lib/validate";
import { findLoginConflict, optionalEmail, optionalPhone, requiredName } from "@/lib/identity";

const schema = z.object({
  parentId: z.string().uuid(),
  name: requiredName,
  email: optionalEmail,
  loginPhone: optionalPhone,
  phone: optionalPhone,
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = (session?.user as any)?.schoolId;
    const parsed = await parseBody(req, schema);
    if (parsed.error) return parsed.error;
    const { parentId, name, email, loginPhone, phone } = parsed.data;

    const conflict = await findLoginConflict({ email, loginPhone, excludeParentId: parentId, schoolId });
    if (conflict) return fieldErrorResponse(conflict, 409);

    const { error } = await supabaseAdmin
      .from("parents")
      .update({ name, email, login_phone: loginPhone, phone })
      .eq("id", parentId)
      .eq("school_id", schoolId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
