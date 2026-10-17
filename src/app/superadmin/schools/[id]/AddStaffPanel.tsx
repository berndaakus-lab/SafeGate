"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import FieldError, { readApiErrors, withErrorRing, type FieldErrors } from "@/components/FieldError";

const roles = [
  { value: "admin", label: "Admin, full access to this school" },
  { value: "guard", label: "Guard, scan QR at the gate" },
  { value: "teacher", label: "Teacher, scan QR when on duty" },
];

const inputClass =
  "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

const empty = { name: "", email: "", loginPhone: "", password: "", role: "admin" };

export default function AddStaffPanel({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [added, setAdded] = useState("");

  function set(key: keyof typeof empty, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => {
      const next = { ...e, [key]: "" };
      if (key === "email" || key === "loginPhone") next.email = next.loginPhone = "";
      return next;
    });
  }

  function close() {
    setOpen(false);
    setForm(empty);
    setError("");
    setFieldErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setAdded("");
    if (!form.email.trim() && !form.loginPhone.trim()) {
      const msg = "Enter an email or a login phone number.";
      setFieldErrors({ email: msg, loginPhone: msg });
      return;
    }
    setLoading(true);
    const res = await fetch("/api/superadmin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, schoolId }),
    });
    setLoading(false);

    if (!res.ok) {
      const { message, fields } = await readApiErrors(res, "Failed to add staff member.");
      setFieldErrors(fields);
      setError(message);
      return;
    }

    setAdded(`${form.name} added as ${form.role}.`);
    close();
    router.refresh();
  }

  if (!open) {
    return (
      <div className="px-6 py-3 border-t border-slate-50">
        {added && <p className="text-xs text-green-600 mb-2">{added}</p>}
        <button
          onClick={() => { setOpen(true); setAdded(""); }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" /> Add staff
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Add staff member</p>
        <button type="button" onClick={close} className="text-slate-400 hover:text-slate-600" aria-label="Cancel">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label htmlFor="sa-role" className="block text-xs font-medium text-slate-500 mb-1">Role</label>
        <select id="sa-role" value={form.role} onChange={(e) => set("role", e.target.value)}
          className={withErrorRing(`${inputClass} bg-white`, !!fieldErrors.role)}>
          {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <FieldError message={fieldErrors.role} />
      </div>

      <div>
        <label htmlFor="sa-name" className="block text-xs font-medium text-slate-500 mb-1">Full name</label>
        <input id="sa-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ama Owusu"
          className={withErrorRing(inputClass, !!fieldErrors.name)} />
        <FieldError message={fieldErrors.name} />
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500">Sign-in details (email optional, at least one)</p>
        <div className="grid grid-cols-1 gap-2 mt-1">
          <div>
            <input type="email" aria-label="Email" autoCapitalize="none" value={form.email}
              onChange={(e) => set("email", e.target.value)} placeholder="Email"
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
        <label htmlFor="sa-password" className="block text-xs font-medium text-slate-500 mb-1">Temporary password</label>
        <PasswordInput id="sa-password" value={form.password} onChange={(e) => set("password", e.target.value)}
          placeholder="At least 8 characters" className={withErrorRing(inputClass, !!fieldErrors.password)} />
        <FieldError message={fieldErrors.password} />
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      <button type="submit" disabled={loading}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {loading ? "Adding..." : "Add staff member"}
      </button>
    </form>
  );
}
