"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, Trash2 } from "lucide-react";
import PhotoCropper from "@/components/PhotoCropper";

/**
 * A child's photo with add/change/remove. Used by the school admin (Parents
 * page) and by parents (My Children); `endpoint` decides whose rules apply.
 */
export default function StudentPhotoButton({
  studentId,
  name,
  photoUrl,
  endpoint,
  size = "md",
}: {
  studentId: string;
  name: string;
  photoUrl: string | null;
  endpoint: "/api/admin/student-photo" | "/api/parent/student-photo";
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(photoUrl);
  const [pending, setPending] = useState<File | null>(null);

  const box = size === "sm" ? "w-12 h-12" : "w-16 h-16";
  const px = size === "sm" ? 48 : 64;

  async function send(photoData: string | null) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, photoData }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save the photo.");
        return;
      }
      setCurrent(data.photoUrl ?? null);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose a photo (JPG or PNG).");
      return;
    }
    setError("");
    setPending(file);
  }

  return (
    <div className="flex items-center gap-3">
      {pending && (
        <PhotoCropper
          file={pending}
          onCancel={() => setPending(null)}
          onDone={(data) => {
            setPending(null);
            send(data);
          }}
        />
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        aria-label={current ? `Change ${name}'s photo` : `Add a photo of ${name}`}
        className={`relative ${box} rounded-full overflow-hidden shrink-0 bg-blue-100 flex items-center justify-center group disabled:opacity-70`}
      >
        {current ? (
          <Image src={current} alt={name} width={px} height={px} className="w-full h-full object-cover" />
        ) : (
          <span className="font-bold text-blue-700 text-lg">{name[0]?.toUpperCase()}</span>
        )}
        <span className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${busy ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          {busy ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
        </span>
        {!current && !busy && (
          <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center">
            <Camera className="w-2.5 h-2.5 text-white" />
          </span>
        )}
      </button>
      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="text-sm font-semibold text-blue-700 hover:underline disabled:opacity-60"
        >
          {busy ? "Saving..." : current ? "Change photo" : "Add photo"}
        </button>
        {current && !busy && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Remove ${name}'s photo?`)) send(null);
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600"
          >
            <Trash2 className="w-3 h-3" /> Remove
          </button>
        )}
        {error && <p role="alert" className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    </div>
  );
}
