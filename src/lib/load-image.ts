/**
 * Crops a picked photo to a centred square and shrinks it (320px JPEG, a few
 * KB) so uploads are fast on mobile data and look sharp at the gate.
 */
export async function squarePhoto(file: File, size = 320): Promise<string> {
  const img = await loadImageFile(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const min = Math.min(img.width, img.height);
  canvas
    .getContext("2d")!
    .drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.82);
}

// Loads a picked file as an <img> via a data: URL. blob: URLs would be simpler,
// but the CSP img-src (src/proxy.ts) only allows 'self', data: and Supabase.
export function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("That file could not be read."));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("That file could not be read as an image."));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
