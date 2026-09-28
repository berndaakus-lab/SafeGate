import { Loader2 } from "lucide-react";

export default function VerifyLoading() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-3 px-6 text-center">
      <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
      <p className="font-semibold">Checking pickup code...</p>
      <p className="text-slate-400 text-sm">This only takes a moment.</p>
    </div>
  );
}
