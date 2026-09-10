"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, GraduationCap, Camera, X, Check } from "lucide-react";

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
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
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = reject;
    img.src = url;
  });
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
        <p className="text-xs text-green-600 font-medium mb-2 flex items-center gap-1">
          <Check className="w-3.5 h-3.5" /> Child added to {parentName}&apos;s account
        </p>
      )}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add child for {parentName}
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
                className="relative w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors flex items-center justify-center bg-slate-50 overflow-hidden"
              >
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-5 h-5 text-slate-400" />
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Child's full name *"
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Class (e.g. KG 2 / Primary 3)"
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              {loading ? "Adding..." : "Add Child"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-slate-400 hover:text-slate-600 px-3 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
