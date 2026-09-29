"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, GraduationCap, Camera, X, Check } from "lucide-react";
import { loadImageFile } from "@/lib/load-image";
import { btnPrimary, btnSecondary, btnSmall, inputBase } from "@/components/ui";

async function compressImage(file: File): Promise<string> {
  const img = await loadImageFile(file);
  const SIZE = 200;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  // Crop to square from center
  const min = Math.min(img.width, img.height);
  const sx = (img.width - min) / 2;
  const sy = (img.height - min) / 2;
  ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export default function AddChildInline({
  parentId,
  schoolId,
  parentName,
}: {
  parentId: string;
  schoolId: string;
  parentName: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setPhotoData(compressed);
    setPhotoPreview(compressed);
  }

  function reset() {
    setOpen(false);
    setName("");
    setClassName("");
    setPhotoPreview(null);
    setPhotoData(null);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/add-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, className, parentId, schoolId, photoData }),
    });

    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Failed to add child.");
      return;
    }

    setSuccess(true);
    reset();
    setTimeout(() => setSuccess(false), 3000);
    router.refresh();
  }

  return (
    <div>
      {success && (
        <p role="status" className="text-sm text-green-700 font-semibold mb-2 flex items-center gap-1.5">
          <Check className="w-4 h-4" /> Child added to {parentName}&apos;s account
        </p>
      )}

      {!open ? (
        <button onClick={() => setOpen(true)} className={btnSmall}>
          <Plus className="w-4 h-4" />
          Add child
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-start gap-3 flex-wrap">
            {/* Photo picker */}
            <div className="shrink-0">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhoto}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Add child photo"
                className="relative w-16 h-16 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors flex flex-col items-center justify-center gap-0.5 bg-white overflow-hidden"
              >
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-blue-500" />
                    <span className="text-[10px] font-semibold text-blue-600">Photo</span>
                  </>
                )}
              </button>
              {photoPreview && (
                <button
                  type="button"
                  onClick={() => { setPhotoPreview(null); setPhotoData(null); }}
                  className="block text-center w-14 text-xs text-slate-400 hover:text-red-500 mt-1"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Name + class */}
            <div className="flex-1 flex flex-col gap-2 min-w-48">
              <input
                autoFocus
                required
                aria-label="Child's full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Child's full name *"
                className={inputBase}
              />
              <input
                aria-label="Class"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Class (e.g. KG 2 / Primary 3)"
                className={inputBase}
              />
            </div>
          </div>

          {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={loading} className={btnPrimary}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? "Adding..." : `Add child for ${parentName.split(" ")[0]}`}
            </button>
            <button type="button" onClick={reset} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
