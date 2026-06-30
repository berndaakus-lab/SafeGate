"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, AlertCircle } from "lucide-react";

export default function QRScanner() {
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "starting" | "scanning" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

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
          scanner.stop();
          // Extract code from URL or use raw value
          const match = decodedText.match(/\/guard\/verify\/([^/?#]+)/);
          const code = match ? match[1] : decodedText;
          router.push(`/guard/verify/${code}`);
        },
        () => {}
      );
      setStatus("scanning");
    } catch {
      setStatus("error");
      setErrorMsg("Camera access denied. Please allow camera access and try again.");
    }
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div>
      {/* Must always be in DOM for iOS Safari camera to initialise */}
      <div
        id="qr-reader"
        ref={containerRef}
        className="rounded-2xl overflow-hidden bg-slate-800"
        style={{ width: "100%", display: status === "scanning" ? "block" : "none" }}
      />

      {status !== "scanning" && (
        <div className="bg-slate-800 rounded-2xl p-8 flex flex-col items-center gap-6">
          <div className="w-32 h-32 border-2 border-dashed border-slate-600 rounded-2xl flex items-center justify-center">
            <Camera className="w-12 h-12 text-slate-500" />
          </div>

          {status === "error" && (
            <div className="flex items-start gap-2 bg-red-900/30 text-red-400 border border-red-800/50 px-4 py-3 rounded-xl text-sm w-full">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {errorMsg}
            </div>
          )}

          <button
            onClick={startScanner}
            disabled={status === "starting"}
            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 w-full justify-center"
          >
            {status === "starting" ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Starting camera...</>
            ) : (
              <><Camera className="w-5 h-5" /> Start Scanning</>
            )}
          </button>
        </div>
      )}

      <div className="mt-6 bg-slate-800/50 rounded-2xl p-5">
        <p className="text-slate-400 text-sm text-center mb-3">Or enter code manually</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const code = (e.currentTarget.elements.namedItem("code") as HTMLInputElement).value;
            if (code.trim()) router.push(`/guard/verify/${code.trim()}`);
          }}
          className="flex gap-2"
        >
          <input
            name="code"
            placeholder="Enter pickup code"
            className="flex-1 px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
