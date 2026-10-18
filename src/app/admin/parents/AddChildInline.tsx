"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Camera, Check } from "lucide-react";
import PhotoCropper from "@/components/PhotoCropper";
import ClassSelect from "@/components/ClassSelect";
import PickStudent from "./PickStudent";
import PhotoSourceSheet from "@/components/PhotoSourceSheet";
import { btnPrimary, btnSecondary, btnSmall, inputBase } from "@/components/ui";

export default function AddChildInline({
  parentId,
  schoolId,
  parentName,
  levels,
}: {
  parentId: string;
  schoolId: string;
  parentName: string;
  levels: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // "pick" = choose from the school's student list; "new" = type a child who isn't on it
  const [mode, setMode] = useState<"pick" | "new">("pick");
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [pending, setPending] = useState<File | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setOpen(false);
    setMode("pick");
    setName("");
    setClassName("");
    setPhotoPreview(null);
    setPhotoData(null);
    setError("");
  }

  async function submit(allowDuplicate = false) {
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/add-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, className, parentId, schoolId, photoData, allowDuplicate }),
    });

    setLoading(false);
    const d = await res.json().catch(() => ({}));
    if (res.status === 409 && d.code === "duplicate") {
      if (window.confirm(d.error)) await submit(true);
      return;
    }
    if (!res.ok) {
      setError(d.error || "Failed to add child.");
      return;
    }

    done();
  }

  function done() {
    setSuccess(true);
    reset();
    setTimeout(() => setSuccess(false), 3000);
    router.refresh();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit();
  }

  return (
    <div>
      {choosing && (
        <PhotoSourceSheet onCancel={() => setChoosing(false)} onFile={(file) => { setChoosing(false); setPending(file); }} />
      )}
      {pending && (
        <PhotoCropper
          file={pending}
          onCancel={() => setPending(null)}
          onDone={(data) => {
            setPending(null);
            setPhotoData(data);
            setPhotoPreview(data);
          }}
        />
      )}
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
      ) : mode === "pick" ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-800">Pick {parentName.split(" ")[0]}&apos;s child from your student list</p>
          <PickStudent parentId={parentId} parentName={parentName} onLinked={done} onNone={() => setMode("new")} />
          <div className="flex flex-wrap gap-3 items-center">
            <button type="button" onClick={() => setMode("new")} className="text-sm font-semibold text-blue-700 hover:underline">
              Not on the list? Add a new child
            </button>
            <button type="button" onClick={reset} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-start gap-3 flex-wrap">
            {/* Photo picker */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setChoosing(true)}
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
              <ClassSelect
                aria-label="Class"
                levels={levels}
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                emptyLabel="Class (optional)"
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
            <button type="button" onClick={() => setMode("pick")} className="text-sm font-semibold text-blue-700 hover:underline px-2">
              Pick from the student list instead
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
