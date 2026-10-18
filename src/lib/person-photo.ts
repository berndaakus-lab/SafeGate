import { supabaseAdmin } from "./supabase";

const BUCKET = "person-photos";

function pathFromUrl(url: string | null | undefined): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const i = url?.indexOf(marker) ?? -1;
  return url && i !== -1 ? url.slice(i + marker.length) : null;
}

/** Uploads a cropped photo (data URL) and returns its public URL. */
export async function uploadPersonPhoto(parentId: string, dataUrl: string): Promise<{ url: string } | { error: string }> {
  const [, mime, base64] = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/)!;
  // New name per upload so phones and the CDN never show a stale cached photo
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const path = `${parentId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, Buffer.from(base64, "base64"), { contentType: mime, upsert: false });
  if (error) return { error: `Photo upload failed: ${error.message}` };
  return { url: supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}

export async function removePersonPhoto(url: string | null | undefined) {
  const path = pathFromUrl(url);
  if (!path) return;
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
  if (error) console.warn("[person-photo] could not delete photo:", error.message);
}
