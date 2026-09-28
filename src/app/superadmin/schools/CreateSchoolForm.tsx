"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, School, User, Check } from "lucide-react";
import FieldError, { readApiErrors, withErrorRing, type FieldErrors } from "@/components/FieldError";
import LogoPicker from "@/components/LogoPicker";

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const emptySchool = { name: "", address: "", phone: "" };
const emptyAdmin = { name: "", email: "", loginPhone: "", password: "" };

export default function CreateSchoolForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<{ schoolName: string; adminLogin: string; logoWarning?: string } | null>(null);

  const [school, setSchool] = useState(emptySchool);
  const [logoData, setLogoData] = useState<string | null>(null);
  const [admin, setAdmin] = useState(emptyAdmin);

  function clearError(key: string) {
    setFieldErrors((e) => {
      const next = { ...e, [key]: "" };
      if (key === "admin.email" || key === "admin.loginPhone") next["admin.email"] = next["admin.loginPhone"] = "";
      return next;
    });
  }

  function schoolInput(key: keyof typeof emptySchool, placeholder: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) {
    const path = `school.${key}`;
    return (
      <div>
        <input {...props} aria-label={placeholder} placeholder={placeholder} value={school[key]}
          onChange={(e) => { setSchool({ ...school, [key]: e.target.value }); clearError(path); }}
          className={withErrorRing(inputClass, !!fieldErrors[path])} />
        <FieldError message={fieldErrors[path]} />
      </div>
    );
  }

  function adminInput(key: keyof typeof emptyAdmin, placeholder: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) {
    const path = `admin.${key}`;
    return (
      <div>
        <input {...props} aria-label={placeholder} placeholder={placeholder} value={admin[key]}
          onChange={(e) => { setAdmin({ ...admin, [key]: e.target.value }); clearError(path); }}
          className={withErrorRing(inputClass, !!fieldErrors[path])} />
        <FieldError message={fieldErrors[path]} />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    if (!admin.email.trim() && !admin.loginPhone.trim()) {
      const msg = "Enter an email or a login phone number.";
      setFieldErrors({ "admin.email": msg, "admin.loginPhone": msg });
      return;
    }
    setLoading(true);

    const res = await fetch("/api/superadmin/create-school", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ school: { ...school, logoData }, admin }),
    });

    setLoading(false);

    if (!res.ok) {
      const { message, fields } = await readApiErrors(res, "Failed to create school.");
      setFieldErrors(fields);
      setError(message);
      return;
    }

    const { logoWarning } = await res.json().catch(() => ({}));
    setSuccess({
      schoolName: school.name,
      adminLogin: [admin.email, admin.loginPhone].filter(Boolean).join(" or "),
      logoWarning,
    });
    setSchool(emptySchool);
    setLogoData(null);
    setAdmin(emptyAdmin);
    router.refresh();
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
          <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
          School created successfully!
        </div>
        <p className="text-green-700 text-sm">
          <strong>{success.schoolName}</strong> is live on VerifyGate.
        </p>
        <p className="text-green-600 text-sm mt-1">
          Admin login: <strong>{success.adminLogin}</strong>
        </p>
        {success.logoWarning && <p className="text-amber-700 text-sm mt-2">{success.logoWarning}</p>}
        <button
          onClick={() => setSuccess(null)}
          className="mt-4 text-sm text-green-700 underline"
        >
          Add another school
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
          <School className="w-4 h-4 text-blue-600" />
          School Details
        </div>
        <div className="space-y-3">
          <LogoPicker
            schoolName={school.name}
            value={logoData}
            onChange={(v) => { setLogoData(v); clearError("school.logoData"); }}
            error={fieldErrors["school.logoData"]}
          />
          {schoolInput("name", "School name *")}
          {schoolInput("address", "Address (optional)")}
          {schoolInput("phone", "Phone number (optional)", { type: "tel", inputMode: "tel" })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
          <User className="w-4 h-4 text-purple-600" />
          First Admin Account
        </div>
        <div className="space-y-3">
          {adminInput("name", "Admin full name *")}
          {adminInput("email", "Admin email", { type: "email", autoCapitalize: "none" })}
          {adminInput("loginPhone", "Admin login phone", { type: "tel", inputMode: "tel" })}
          <p className="text-xs text-slate-400 -mt-1">Fill in an email, a login phone, or both. The admin can sign in with either.</p>
          {adminInput("password", "Temporary password * (at least 8 characters)", { type: "password" })}
          <p className="text-xs text-slate-400">
            Share this password with the school admin. They can change it after first login.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {loading ? "Creating..." : "Create School & Admin"}
      </button>
    </form>
  );
}
