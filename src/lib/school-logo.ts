import { z } from "zod";
import { supabaseAdmin } from "./supabase";

const BUCKET = "school-logos";

// The client resizes logos to at most 512px before upload, so real payloads
// are well under this; the cap only stops oversized or hand-crafted requests.
export const logoDataUrl = z
  .string()
  .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, "The logo must be a PNG, JPG or WebP image.")
  .max(2_800_000, "The logo image is too large. Use an image under 2 MB.");

export async function uploadSchoolLogo(schoolId: string, dataUrl: string): Promise<string> {
  const [, mime, base64] = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/)!;
  const ext = mime.split("/")[1] === "jpeg" ? "jpg" : mime.split("/")[1];
  // A new file name per upload so browsers and the CDN never show a stale cached logo.
  const path = `${schoolId}/${Date.now()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, Buffer.from(base64, "base64"), { contentType: mime, upsert: false });
  if (error) throw new Error(`Logo upload failed: ${error.message}`);

  return supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function deleteSchoolLogoFile(publicUrl: string | null | undefined) {
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl?.indexOf(marker) ?? -1;
  if (!publicUrl || idx === -1) return;
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([publicUrl.slice(idx + marker.length)]);
  if (error) console.warn("[school-logo] failed to delete old logo:", error.message);
}
