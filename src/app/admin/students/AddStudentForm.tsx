"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import ClassSelect from "@/components/ClassSelect";
import { btnPrimary, inputBase, labelBase } from "@/components/ui";

export default function AddStudentForm({ schoolId, levels }: { schoolId: string; levels: string[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function submit(allowDuplicate = false) {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/add-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, className, schoolId, allowDuplicate }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.status === 409 && data.code === "duplicate") {
      if (window.confirm(data.error)) await submit(true);
      return;
    }
    if (!res.ok) {
      setError(data.error || "Could not add the student. Try again.");
      return;
    }
    setDone(`${name.trim()} added to your student list.`);
    setName("");
    router.refresh();
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); setDone(""); submit(); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ns-name" className={labelBase}>Student name *</label>
          <input id="ns-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kofi Mensah" className={inputBase} />
        </div>
        <div>
          <label htmlFor="ns-class" className={labelBase}>Class</label>
          <ClassSelect id="ns-class" levels={levels} value={className} onChange={(e) => setClassName(e.target.value)}
            emptyLabel="No class yet" className={inputBase} />
        </div>
      </div>
      {error && <div role="alert" className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}
      {done && <div role="status" className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">{done}</div>}
      <button type="submit" disabled={loading || !name.trim()} className={btnPrimary}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add student
      </button>
    </form>
  );
}
