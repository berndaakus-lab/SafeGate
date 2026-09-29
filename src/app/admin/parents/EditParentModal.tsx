"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, X } from "lucide-react";
import FieldError, { readApiErrors, withErrorRing, type FieldErrors } from "@/components/FieldError";
import { btnSmall } from "@/components/ui";

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

type Parent = { id: string; name: string; email: string | null; login_phone: string | null; phone: string | null };

export default function EditParentModal({ parent }: { parent: Parent }) {
  const router = useRouter();
  const initial = {
    name: parent.name,
    email: parent.email ?? "",
    loginPhone: parent.login_phone ?? "",
    phone: parent.phone ?? "",
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

    const res = await fetch("/api/admin/update-parent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId: parent.id, ...form }),
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
      <button onClick={openModal} className={`${btnSmall} shrink-0`} aria-label={`Edit ${parent.name}`}>
        <Pencil className="w-3.5 h-3.5" /> Edit
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-900 text-lg">Edit Parent</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="ep-name" className="block text-sm font-semibold text-slate-800 mb-1.5">Full name</label>
                <input id="ep-name" value={form.name} onChange={(e) => set("name", e.target.value)}
                  className={withErrorRing(inputClass, !!fieldErrors.name)} />
                <FieldError message={fieldErrors.name} />
              </div>
              <div>
                <label htmlFor="ep-email" className="block text-sm font-semibold text-slate-800 mb-1.5">Email</label>
                <input id="ep-email" type="email" autoCapitalize="none" value={form.email}
                  onChange={(e) => set("email", e.target.value)} placeholder="Optional if a login phone is set"
                  className={withErrorRing(inputClass, !!fieldErrors.email)} />
                <FieldError message={fieldErrors.email} />
              </div>
              <div>
                <label htmlFor="ep-login-phone" className="block text-sm font-semibold text-slate-800 mb-1.5">Login phone</label>
                <input id="ep-login-phone" type="tel" inputMode="tel" value={form.loginPhone}
                  onChange={(e) => set("loginPhone", e.target.value)} placeholder="Optional if an email is set"
                  className={withErrorRing(inputClass, !!fieldErrors.loginPhone)} />
                <FieldError message={fieldErrors.loginPhone} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="ep-phone" className="block text-sm font-semibold text-slate-800">SMS alert phone</label>
                  {form.loginPhone.trim() && form.phone !== form.loginPhone && (
                    <button type="button" onClick={() => set("phone", form.loginPhone)} className="text-xs font-medium text-blue-600 hover:underline">
                      Same as login phone
                    </button>
                  )}
                </div>
                <input id="ep-phone" type="tel" inputMode="tel" value={form.phone}
                  onChange={(e) => set("phone", e.target.value)} placeholder="Where pickup SMS alerts go"
                  className={withErrorRing(inputClass, !!fieldErrors.phone)} />
                <FieldError message={fieldErrors.phone} />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
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
