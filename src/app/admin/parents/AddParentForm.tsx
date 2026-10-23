"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import FieldError, { readApiErrors, withErrorRing, type FieldErrors } from "@/components/FieldError";

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const empty = { name: "", email: "", loginPhone: "", phone: "", password: "" };

export default function AddParentForm({ schoolId }: { schoolId: string }) {
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

    const res = await fetch("/api/admin/create-parent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, schoolId }),
    });

    setLoading(false);

    if (!res.ok) {
      const { message, fields } = await readApiErrors(res, "Failed to create parent account.");
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
      <div>
        <label htmlFor="ap-name" className="block text-sm font-semibold text-slate-800 mb-1.5">Parent name *</label>
        <input id="ap-name" value={form.name} onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Abena Mensah" className={withErrorRing(inputClass, !!fieldErrors.name)} />
        <p className="text-xs text-slate-500 mt-1.5">Don't have the parent's name? Type Parent of and the child's name, e.g. Parent of Kofi Mensah. The parent corrects it when they first sign in.</p>
        <FieldError message={fieldErrors.name} />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-800">Sign-in details</p>
        <p className="text-sm text-slate-500 mb-2">Email is optional. The parent can sign in with a phone number or an email, so fill in at least one.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <input type="email" aria-label="Email" value={form.email} onChange={(e) => set("email", e.target.value)}
              autoCapitalize="none" placeholder="Email, e.g. parent@email.com"
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
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="ap-phone" className="block text-sm font-semibold text-slate-800">SMS alert phone</label>
          {form.loginPhone.trim() && form.phone !== form.loginPhone && (
            <button type="button" onClick={() => set("phone", form.loginPhone)} className="text-xs font-medium text-blue-600 hover:underline">
              Same as login phone
            </button>
          )}
        </div>
        <input id="ap-phone" type="tel" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
          placeholder="Where pickup SMS alerts go" className={withErrorRing(inputClass, !!fieldErrors.phone)} />
        <FieldError message={fieldErrors.phone} />
      </div>

      <div>
        <label htmlFor="ap-password" className="block text-sm font-semibold text-slate-800 mb-1.5">Temporary password *</label>
        <PasswordInput id="ap-password" value={form.password} onChange={(e) => set("password", e.target.value)}
          placeholder="At least 8 characters. Share it with the parent."
          className={withErrorRing(inputClass, !!fieldErrors.password)} />
        <FieldError message={fieldErrors.password} />
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">Parent account created successfully!</div>}

      <button type="submit" disabled={loading}
        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {loading ? "Creating..." : "Add Parent"}
      </button>
    </form>
  );
}
