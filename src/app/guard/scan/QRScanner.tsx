"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, AlertCircle } from "lucide-react";

export default function QRScanner() {
  const scannerRef = useRef<any>(null);
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "starting" | "scanning" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [foundCode, setFoundCode] = useState<string | null>(null);

  async function startScanner() {
    setStatus("starting");

    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          scanner.stop().catch(() => {});
          const match = decodedText.match(/\/guard\/verify\/([^/?#]+)/);
          const code = match ? match[1] : decodedText.trim();
          setFoundCode(code);
          // Hard navigate, avoids race between scanner teardown and Next.js router
          window.location.href = `/guard/verify/${code}`;
        },
        () => {}
      );
      setStatus("scanning");
    } catch {
      setStatus("error");
      setErrorMsg("Camera access denied or not available. Use the manual code entry below.");
    }
  }

  useEffect(() => {
    // Download the scanner library while the guard is still reading the page,
    // so tapping "Start Scanning" only has to open the camera.
    import("html5-qrcode").catch(() => {});
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  return (
    <div>
      {/* Camera viewport, always in DOM so html5-qrcode can render into it */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-800" style={{ minHeight: 300 }}>
        <div id="qr-reader" style={{ width: "100%" }} />

        {/* Overlay shown before scanning starts */}
        {status !== "scanning" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-slate-800 p-8">
            {/* Viewfinder graphic */}
            <div className="relative w-44 h-44">
              <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-xl" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-xl" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-xl" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-14 h-14 text-slate-600" />
              </div>
            </div>

            {status === "error" && (
              <div className="flex items-start gap-2 bg-red-900/40 text-red-400 border border-red-800/50 px-4 py-3 rounded-xl text-sm w-full max-w-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {errorMsg}
              </div>
            )}

            <button
              onClick={startScanner}
              disabled={status === "starting"}
              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 w-full max-w-xs justify-center"
            >
              {status === "starting" ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Starting camera...</>
              ) : (
                <><Camera className="w-5 h-5" /> {status === "error" ? "Try Again" : "Start Scanning"}</>
              )}
            </button>
          </div>
        )}

        {foundCode && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-900/90 text-center p-6">
            <Loader2 className="w-10 h-10 text-green-400 animate-spin" />
            <p className="text-green-300 font-semibold">Code found</p>
            <p className="text-slate-400 text-sm">Loading pickup details...</p>
          </div>
        )}

        {/* Scanning hint shown while active */}
        {status === "scanning" && !foundCode && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
            <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
              Point camera at QR code
            </span>
          </div>
        )}
      </div>

      {/* Manual code entry */}
      <div className="mt-4 bg-slate-800/50 rounded-2xl p-5">
        <p className="text-slate-400 text-sm text-center mb-3">Or enter code manually</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const code = (e.currentTarget.elements.namedItem("code") as HTMLInputElement).value;
            if (code.trim()) router.push(`/guard/verify/${code.trim().toUpperCase()}`);
          }}
          className="flex gap-2"
        >
          <input
            name="code"
            placeholder="e.g. K7MX3P"
            autoCapitalize="characters"
            className="flex-1 px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono tracking-widest uppercase"
          />
          <button
            type="submit"
            className="px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            Verify
          </button>
        </form>
      </div>
    </div>
  );
}
