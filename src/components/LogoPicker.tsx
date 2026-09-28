"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import SchoolLogo from "./SchoolLogo";
import FieldError from "./FieldError";

const MAX_SIDE = 512;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

// Scales the logo down to at most 512px on its longest side. PNG/WebP sources
// stay PNG so transparent backgrounds survive; photos become JPEG.
async function resizeLogo(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("That file could not be read as an image."));
      el.src = url;
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return file.type === "image/jpeg" ? canvas.toDataURL("image/jpeg", 0.88) : canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function LogoPicker({
  schoolName,
  value,
  onChange,
  busy = false,
  error,
}: {
  schoolName: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  busy?: boolean;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLocalError("");
    if (!ACCEPTED.includes(file.type)) {
      setLocalError("Choose a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setLocalError("That image is over 10 MB. Choose a smaller file.");
      return;
    }
    try {
      onChange(await resizeLogo(file));
    } catch (err: any) {
      setLocalError(err?.message ?? "That image could not be used.");
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <SchoolLogo name={schoolName || "School"} logoUrl={value} size="xl" />
        <div className="flex flex-col gap-2">
          <input ref={inputRef} type="file" accept={ACCEPTED.join(",")} className="hidden" onChange={handleFile} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {value ? "Change logo" : "Upload logo"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-2">PNG, JPG or WebP. A square logo on a transparent background looks best.</p>
      <FieldError message={localError || error} />
    </div>
  );
}
