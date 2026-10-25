import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LookupClient from "./LookupClient";

export const dynamic = "force-dynamic";

export default function LookupPage() {
  return (
    <div className="flex-1 bg-slate-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link href="/guard/scan" className="flex items-center gap-2 text-slate-300 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to scanner
        </Link>
      </header>
      <main className="flex-1 px-5 py-6">
        <div className="w-full max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-1">No pass? Find the child</h1>
          <p className="text-slate-400 text-sm mb-5">
            Search the child&apos;s name, pick the person who is here, and the parent gets a message to approve. Never release a child until you see the approval.
          </p>
          <LookupClient />
        </div>
      </main>
    </div>
  );
}
