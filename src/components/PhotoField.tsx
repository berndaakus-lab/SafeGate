"use client";

import { useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import PhotoSourceSheet from "@/components/PhotoSourceSheet";
import PhotoCropper from "@/components/PhotoCropper";

/**
 * A photo picker for forms: camera or library, then crop. `preview` is what to
 * show now (a new cropped photo, or the saved photo's URL); `onChange` gets a
 * cropped data URL, or null when the person removes it.
 */
export default function PhotoField({
  label,
  preview,
  onChange,
  initial,
}: {
  label: string;
  preview: string | null;
  onChange: (dataUrl: string | null) => void;
  initial?: string;
}) {
  const [choosing, setChoosing] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="flex items-center gap-4">
      <button type="button" onClick={() => setChoosing(true)} aria-label={preview ? `Change ${label}` : `Add ${label}`}
        className="relative w-20 h-20 rounded-full overflow-hidden bg-blue-50 border-2 border-dashed border-blue-300 hover:border-blue-500 flex items-center justify-center shrink-0">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-7 h-7 text-blue-500" />
        )}
      </button>
      <div className="flex flex-col items-start gap-1">
        <button type="button" onClick={() => setChoosing(true)} className="text-sm font-semibold text-blue-700 hover:underline">
          {preview ? "Change photo" : label}
        </button>
        {preview && (
          <button type="button" onClick={() => onChange(null)} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600">
            <Trash2 className="w-3 h-3" /> Remove
          </button>
        )}
        {initial && !preview && <p className="text-xs text-slate-500">{initial}</p>}
      </div>

      {choosing && (
        <PhotoSourceSheet
          onCancel={() => setChoosing(false)}
          onFile={(f) => {
            setChoosing(false);
            setFile(f);
          }}
        />
      )}
      {file && (
        <PhotoCropper
          file={file}
          onCancel={() => setFile(null)}
          onDone={(data) => {
            setFile(null);
            onChange(data);
          }}
        />
      )}
    </div>
  );
}
