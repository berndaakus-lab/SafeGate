"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageIcon, X } from "lucide-react";

/**
 * Asks where a photo comes from: the camera or the photo library. On phones
 * "Take a photo" opens the native camera; on a computer it opens the webcam in
 * the sheet. The chosen picture is handed back as a File, ready for the cropper.
 */
export default function PhotoSourceSheet({ onFile, onCancel }: { onFile: (file: File) => void; onCancel: () => void }) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");

  function stopCamera() {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }

  useEffect(() => stopCamera, []);

  function picked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onFile(file);
  }

  async function takePhoto() {
    setError("");
    const phone = window.matchMedia("(pointer: coarse)").matches;
    if (phone || !navigator.mediaDevices?.getUserMedia) {
      cameraInput.current?.click();
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setLive(true);
      requestAnimationFrame(() => {
        if (video.current && stream.current) {
          video.current.srcObject = stream.current;
          video.current.play().catch(() => {});
        }
      });
    } catch {
      setError("The camera couldn't be opened. Allow camera access for this site, or choose a photo from the library.");
    }
  }

  function capture() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")!.drawImage(v, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return setError("Couldn't take the picture. Try again.");
        stopCamera();
        onFile(new File([blob], "photo.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9
    );
  }

  function close() {
    stopCamera();
    onCancel();
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Add a photo"
      className="fixed inset-0 z-[65] bg-slate-900/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Add a photo</h2>
          <button type="button" onClick={close} aria-label="Close" className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {live ? (
          <div className="space-y-3">
            <video ref={video} playsInline muted className="w-full rounded-xl bg-black aspect-[4/3] object-cover -scale-x-100" />
            <div className="flex gap-3">
              <button type="button" onClick={() => { stopCamera(); setLive(false); }}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50">
                Back
              </button>
              <button type="button" onClick={capture}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">
                Take picture
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button type="button" onClick={takePhoto}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-left">
              <Camera className="w-5 h-5 text-blue-600 shrink-0" />
              <span><span className="block font-semibold text-slate-900">Take a photo</span><span className="block text-xs text-slate-500">Use the camera now</span></span>
            </button>
            <button type="button" onClick={() => libraryInput.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-left">
              <ImageIcon className="w-5 h-5 text-blue-600 shrink-0" />
              <span><span className="block font-semibold text-slate-900">Choose from library</span><span className="block text-xs text-slate-500">Pick a picture you already have</span></span>
            </button>
            {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
          </div>
        )}

        <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={picked} />
        <input ref={libraryInput} type="file" accept="image/*" className="hidden" onChange={picked} />
      </div>
    </div>
  );
}
