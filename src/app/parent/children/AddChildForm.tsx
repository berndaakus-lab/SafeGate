"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

export default function AddChildForm({ parentId, schoolId }: { parentId: string; schoolId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/parent/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, className, parentId, schoolId }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Failed to add child. Please try again.");
      return;
    }

    setSuccess(true);
    setName("");
    setClassName("");
    setTimeout(() => setSuccess(false), 3000);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Child&apos;s full name <span className="text-red-500">*</span>
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Ama Mensah"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Class / Grade
        </label>
        <input
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          placeholder="e.g. Primary 3 or JHS 1"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">
          Child added successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {loading ? "Adding..." : "Add Child"}
      </button>
    </form>
  );
}
