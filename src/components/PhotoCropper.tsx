"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { loadImageFile } from "@/lib/load-image";

const VIEW = 288; // crop box, CSS px
const OUT = 320; // saved size, px

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Full-screen square cropper: drag to reposition, slide to zoom. Saves a
 * 320px JPEG (a few KB) so uploads stay fast on mobile data.
 */
export default function PhotoCropper({
  file,
  onCancel,
  onDone,
}: {
  file: File;
  onCancel: () => void;
  onDone: (dataUrl: string) => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    let alive = true;
    loadImageFile(file)
      .then((loaded) => {
        if (!alive) return;
        const base = VIEW / Math.min(loaded.width, loaded.height);
        setImg(loaded);
        setPos({ x: (VIEW - loaded.width * base) / 2, y: (VIEW - loaded.height * base) / 2 });
      })
      .catch(() => alive && setLoadError("That photo could not be read. Try another one."));
    return () => {
      alive = false;
    };
  }, [file]);

  const base = img ? VIEW / Math.min(img.width, img.height) : 1;
  const scale = base * zoom;

  function fit(x: number, y: number, s: number) {
    if (!img) return { x, y };
    return { x: clamp(x, VIEW - img.width * s, 0), y: clamp(y, VIEW - img.height * s, 0) };
  }

  function changeZoom(next: number) {
    if (!img) return;
    const newScale = base * next;
    // keep whatever is at the centre of the box at the centre
    const cx = (VIEW / 2 - pos.x) / scale;
    const cy = (VIEW / 2 - pos.y) / scale;
    setPos(fit(VIEW / 2 - cx * newScale, VIEW / 2 - cy * newScale, newScale));
    setZoom(next);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    setPos(fit(d.ox + e.clientX - d.px, d.oy + e.clientY - d.py, scale));
  }

  function save() {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const side = VIEW / scale;
    canvas.getContext("2d")!.drawImage(img, -pos.x / scale, -pos.y / scale, side, side, 0, 0, OUT, OUT);
    onDone(canvas.toDataURL("image/jpeg", 0.82));
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Crop photo"
      className="fixed inset-0 z-[70] bg-slate-900/70 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">Crop photo</h2>
        <p className="text-sm text-slate-500 mb-4">Drag to move, use the slider to zoom. Keep the face centred.</p>

        <div className="mx-auto rounded-xl overflow-hidden bg-slate-100 relative select-none touch-none cursor-grab active:cursor-grabbing"
          style={{ width: VIEW, height: VIEW, maxWidth: "100%" }}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove}
          onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)}>
          {img ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" draggable={false} className="absolute max-w-none pointer-events-none"
                style={{ left: pos.x, top: pos.y, width: img.width * scale, height: img.height * scale }} />
              <div className="absolute inset-0 rounded-full pointer-events-none"
                style={{ boxShadow: "0 0 0 999px rgba(15,23,42,0.45), inset 0 0 0 2px rgba(255,255,255,0.9)" }} />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 px-6 text-center">
              {loadError || <Loader2 className="w-6 h-6 animate-spin text-slate-400" />}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-4">
          <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
          <input type="range" min={1} max={4} step={0.01} value={zoom} disabled={!img} aria-label="Zoom"
            onChange={(e) => changeZoom(Number(e.target.value))} className="flex-1 accent-blue-600" />
          <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={save} disabled={!img}
            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60">
            Use photo
          </button>
        </div>
      </div>
    </div>
  );
}
