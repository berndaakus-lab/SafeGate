import { z } from "zod";
import { supabaseAdmin } from "./supabase";

const BUCKET = "student-photos";

// Photos are cropped and shrunk on the phone first (see squarePhoto), so a
// real upload is a few KB; the cap only stops oversized or hand-made requests.
export const studentPhotoData = z
  .string()
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "The photo must be a JPG, PNG or WebP image.")
  .max(1_500_000, "That photo is too large. Try a different one.")
  .nullable();

function pathFromUrl(url: string | null | undefined): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const i = url?.indexOf(marker) ?? -1;
  return url && i !== -1 ? url.slice(i + marker.length) : null;
}

/**
 * Sets (or with null, removes) a student's photo and deletes the old file.
 * Callers must already have checked the user may change this student.
 */
export async function saveStudentPhoto({
  studentId,
  schoolId,
  currentUrl,
  dataUrl,
}: {
  studentId: string;
  schoolId: string;
  currentUrl: string | null;
  dataUrl: string | null;
}): Promise<{ photoUrl: string | null } | { error: string }> {
  let photoUrl: string | null = null;

  if (dataUrl) {
    const [, mime, base64] = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/)!;
    // New name per upload so phones and the CDN never show a stale cached photo
    const path = `${schoolId}/${studentId}-${crypto.randomUUID()}.${mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg"}`;
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, Buffer.from(base64, "base64"), { contentType: mime, upsert: false });
    if (error) return { error: `Photo upload failed: ${error.message}` };
    photoUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabaseAdmin.from("students").update({ photo_url: photoUrl }).eq("id", studentId);
  if (error) {
    const newPath = pathFromUrl(photoUrl);
    if (newPath) await supabaseAdmin.storage.from(BUCKET).remove([newPath]);
    return { error: error.message };
  }

  const oldPath = pathFromUrl(currentUrl);
  if (oldPath) {
    const { error: removeError } = await supabaseAdmin.storage.from(BUCKET).remove([oldPath]);
    if (removeError) console.warn("[student-photo] could not delete old photo:", removeError.message);
  }
  return { photoUrl };
}
