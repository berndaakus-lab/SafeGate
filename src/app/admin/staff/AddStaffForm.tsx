"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import FieldError, { readApiErrors, withErrorRing, type FieldErrors } from "@/components/FieldError";

const roles = [
  { value: "guard", label: "Guard, scan QR at the gate" },
  { value: "teacher", label: "Teacher, scan QR when on duty" },
];

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const empty = { name: "", email: "", loginPhone: "", password: "", role: "guard" };

export default function AddStaffForm({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);

  function set(key: keyof typeof empty, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => {
      const next = { ...e, [key]: "" };
      if (key === "email" || key === "loginPhone") next.email = next.loginPhone = "";
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    if (!form.email.trim() && !form.loginPhone.trim()) {
      const msg = "Enter an email or a login phone number.";
      setFieldErrors({ email: msg, loginPhone: msg });
      return;
    }
    setLoading(true);

    const res = await fetch("/api/admin/create-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, schoolId }),
    });

    setLoading(false);

    if (!res.ok) {
      const { message, fields } = await readApiErrors(res, "Failed to create staff account.");
      setFieldErrors(fields);
      setError(message);
      return;
    }

    setSuccess(true);
    setForm(empty);
    setTimeout(() => setSuccess(false), 3000);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="as-name" className="block text-sm font-medium text-slate-700 mb-1.5">Full name *</label>
          <input id="as-name" value={form.name} onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Kwame Asante" className={withErrorRing(inputClass, !!fieldErrors.name)} />
          <FieldError message={fieldErrors.name} />
        </div>
        <div>
          <label htmlFor="as-role" className="block text-sm font-medium text-slate-700 mb-1.5">Role *</label>
          <select id="as-role" value={form.role} onChange={(e) => set("role", e.target.value)}
            className={withErrorRing(`${inputClass} bg-white`, !!fieldErrors.role)}>
            {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <FieldError message={fieldErrors.role} />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">Sign-in details *</p>
        <p className="text-xs text-slate-400 mb-2">They sign in with either one. Fill in at least one.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <input type="email" aria-label="Email" autoCapitalize="none" value={form.email}
              onChange={(e) => set("email", e.target.value)} placeholder="Email, e.g. staff@school.com"
              className={withErrorRing(inputClass, !!fieldErrors.email)} />
            <FieldError message={fieldErrors.email} />
          </div>
          <div>
            <input type="tel" inputMode="tel" aria-label="Login phone" value={form.loginPhone}
              onChange={(e) => set("loginPhone", e.target.value)} placeholder="Login phone, e.g. 0244123456"
              className={withErrorRing(inputClass, !!fieldErrors.loginPhone)} />
            <FieldError message={fieldErrors.loginPhone} />
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="as-password" className="block text-sm font-medium text-slate-700 mb-1.5">Temporary password *</label>
        <input id="as-password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)}
          placeholder="At least 8 characters" className={withErrorRing(inputClass, !!fieldErrors.password)} />
        <FieldError message={fieldErrors.password} />
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">Staff account created!</div>}

      <button type="submit" disabled={loading}
        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {loading ? "Creating..." : "Add Staff"}
      </button>
    </form>
  );
}
