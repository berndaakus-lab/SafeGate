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
