"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, X } from "lucide-react";
import FieldError, { readApiErrors, withErrorRing, type FieldErrors } from "@/components/FieldError";
import { btnSmall } from "@/components/ui";

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

type Staff = { id: string; name: string; email: string | null; login_phone: string | null; role: string };

export default function EditStaffModal({ staff }: { staff: Staff }) {
  const router = useRouter();
  const initial = {
    name: staff.name,
    email: staff.email ?? "",
    loginPhone: staff.login_phone ?? "",
    role: staff.role === "teacher" ? "teacher" : "guard",
  };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function openModal() {
    setForm(initial);
    setError("");
    setFieldErrors({});
    setOpen(true);
  }

  function set(key: keyof typeof initial, value: string) {
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
    const res = await fetch("/api/admin/update-staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId: staff.id, ...form }),
    });
    setLoading(false);
    if (!res.ok) {
      const { message, fields } = await readApiErrors(res, "Failed to update.");
      setFieldErrors(fields);
      setError(message);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={openModal} className={`${btnSmall} shrink-0`} aria-label={`Edit ${staff.name}`}>
        <Pencil className="w-3.5 h-3.5" /> Edit
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-900 text-lg">Edit staff member</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="es-name" className="block text-sm font-semibold text-slate-800 mb-1.5">Full name</label>
                <input id="es-name" value={form.name} onChange={(e) => set("name", e.target.value)}
                  className={withErrorRing(inputClass, !!fieldErrors.name)} />
                <FieldError message={fieldErrors.name} />
              </div>
              <div>
                <label htmlFor="es-role" className="block text-sm font-semibold text-slate-800 mb-1.5">Role</label>
                <select id="es-role" value={form.role} onChange={(e) => set("role", e.target.value)}
                  className={withErrorRing(inputClass, !!fieldErrors.role)}>
                  <option value="guard">Guard, scan QR at the gate</option>
                  <option value="teacher">Teacher, scan QR when on duty</option>
                </select>
                <FieldError message={fieldErrors.role} />
              </div>
              <div>
                <label htmlFor="es-email" className="block text-sm font-semibold text-slate-800 mb-1.5">Email</label>
                <input id="es-email" type="email" autoCapitalize="none" value={form.email}
                  onChange={(e) => set("email", e.target.value)} placeholder="Optional if a login phone is set"
                  className={withErrorRing(inputClass, !!fieldErrors.email)} />
                <FieldError message={fieldErrors.email} />
              </div>
              <div>
                <label htmlFor="es-login-phone" className="block text-sm font-semibold text-slate-800 mb-1.5">Login phone</label>
                <input id="es-login-phone" type="tel" inputMode="tel" value={form.loginPhone}
                  onChange={(e) => set("loginPhone", e.target.value)} placeholder="Optional if an email is set"
                  className={withErrorRing(inputClass, !!fieldErrors.loginPhone)} />
                <FieldError message={fieldErrors.loginPhone} />
              </div>
              <p className="text-xs text-slate-500">Their password stays the same. If you change the email or phone, tell them to sign in with the new one.</p>

              {error && <div role="alert" className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
