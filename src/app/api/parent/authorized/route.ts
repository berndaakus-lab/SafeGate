import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { fieldErrorResponse, parseBody } from "@/lib/validate";
import { studentPhotoData } from "@/lib/student-photo";
import { removePersonPhoto, uploadPersonPhoto } from "@/lib/person-photo";
import { normalizePhone } from "@/lib/identity";

const personFields = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(30).optional().nullable(),
  relation: z.string().trim().max(100).optional().nullable(),
  vehicleNumber: z.string().trim().max(20, "That car number is too long.").optional().nullable(),
  // undefined = leave the photo as it is, null = remove it, text = a new cropped photo
  photoData: studentPhotoData.optional(),
});

const updateSchema = personFields.extend({ id: z.string().uuid() });

const tidyPhone = (v: string | null | undefined) => normalizePhone(v) ?? (v ? v : null);

// "Driver" is the one relationship that needs a car number, so the guard can match the vehicle at the gate
function vehicleFor(
  relation: string | null | undefined,
  raw: string | null | undefined
): { value: string | null; error?: undefined } | { error: string; value?: undefined } {
  if (relation !== "Driver") return { value: null };
  const value = (raw ?? "").trim().toUpperCase().replace(/s+/g, " ");
  return value ? { value } : { error: "Enter the car number for a driver." };
}

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
    const { id, name, phone, relation, photoData } = parsed.data;

    const vehicle = vehicleFor(relation, parsed.data.vehicleNumber);
    if (vehicle.error) return fieldErrorResponse({ vehicleNumber: vehicle.error });

    const { data: person } = await supabaseAdmin
      .from("authorized_persons")
      .select("name, photo_url")
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

    const update: Record<string, unknown> = { name, phone: tidyPhone(phone), relation: relation || null, vehicle_number: vehicle.value };
    let newPhotoUrl: string | null = null;
    if (photoData === null) {
      update.photo_url = null;
    } else if (photoData) {
      const uploaded = await uploadPersonPhoto(parentId, photoData);
      if ("error" in uploaded) return NextResponse.json({ error: uploaded.error }, { status: 500 });
      newPhotoUrl = uploaded.url;
      update.photo_url = newPhotoUrl;
    }

    const { error } = await supabaseAdmin.from("authorized_persons").update(update).eq("id", id).eq("parent_id", parentId);
    if (error) {
      await removePersonPhoto(newPhotoUrl);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (photoData !== undefined) await removePersonPhoto(person.photo_url);
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

    const parsed = await parseBody(req, personFields);
    if (parsed.error) return parsed.error;
    const { name, phone, relation, photoData } = parsed.data;

    const vehicle = vehicleFor(relation, parsed.data.vehicleNumber);
    if (vehicle.error) return fieldErrorResponse({ vehicleNumber: vehicle.error });

    let photoUrl: string | null = null;
    if (photoData) {
      const uploaded = await uploadPersonPhoto(parentId, photoData);
      if ("error" in uploaded) return NextResponse.json({ error: uploaded.error }, { status: 500 });
      photoUrl = uploaded.url;
    }

    const { data, error } = await supabaseAdmin
      .from("authorized_persons")
      .insert({ name, phone: tidyPhone(phone), relation: relation || null, vehicle_number: vehicle.value, photo_url: photoUrl, parent_id: parentId })
      .select()
      .single();

    if (error) {
      await removePersonPhoto(photoUrl);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
