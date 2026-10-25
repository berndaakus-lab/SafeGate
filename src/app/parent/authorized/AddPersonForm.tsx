"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import PhotoField from "@/components/PhotoField";
import { inputBase, labelBase } from "@/components/ui";

const relations = ["Parent", "Uncle", "Aunt", "Grandparent", "Driver", "Sibling", "Family Friend", "Other"];

export default function AddPersonForm({ parentId }: { parentId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vehicleError, setVehicleError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setVehicleError("");
    if (relation === "Driver" && !vehicleNumber.trim()) {
      setVehicleError("Enter the car number for a driver.");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/parent/authorized", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, relation, parentId, vehicleNumber, photoData }),
    });

    setLoading(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      if (d.fields?.vehicleNumber) setVehicleError(d.fields.vehicleNumber);
      else if (d.fields?.phone) setError(d.fields.phone);
      else setError(d.error || "Failed to add person. Please try again.");
      return;
    }

    setSuccess(true);
    setName("");
    setPhone("");
    setRelation("");
    setVehicleNumber("");
    setPhotoData(null);
    setTimeout(() => setSuccess(false), 3000);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PhotoField label="Add their photo" preview={photoData} onChange={setPhotoData}
        initial="A clear photo helps the guard recognise them at the gate." />

      <div>
        <label htmlFor="ap-name" className={labelBase}>
          Full name <span className="text-red-500">*</span>
        </label>
        <input id="ap-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Kofi Mensah" className={inputBase} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ap-phone" className={labelBase}>Phone number</label>
          <input id="ap-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0244123456" className={inputBase} />
        </div>
        <div>
          <label htmlFor="ap-relation" className={labelBase}>Relationship</label>
          <select id="ap-relation" value={relation} onChange={(e) => { setRelation(e.target.value); setVehicleError(""); }} className={inputBase}>
            <option value="">Select...</option>
            {relations.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {relation === "Driver" && (
        <div>
          <label htmlFor="ap-car" className={labelBase}>
            Car number <span className="text-red-500">*</span>
          </label>
          <input id="ap-car" value={vehicleNumber} onChange={(e) => { setVehicleNumber(e.target.value); setVehicleError(""); }}
            autoCapitalize="characters" maxLength={20} placeholder="e.g. GR 1234-24"
            className={`${inputBase} ${vehicleError ? "border-red-400 ring-1 ring-red-300" : ""}`} />
          {vehicleError && <p role="alert" className="text-xs font-medium text-red-600 mt-1.5">{vehicleError}</p>}
          <p className="text-xs text-slate-500 mt-1.5">The guard sees this so they can match the car at the gate. A driver&apos;s phone number is also needed: if they serve several families, one scan covers them all.</p>
        </div>
      )}

      {error && (
        <div role="alert" className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>
      )}
      {success && (
        <div role="status" className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">
          Person added successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {loading ? "Adding..." : "Add Person"}
      </button>
    </form>
  );
}
