"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LogoPicker from "@/components/LogoPicker";
import { readApiErrors } from "@/components/FieldError";

export default function SchoolLogoEditor({
  schoolId,
  schoolName,
  logoUrl,
}: {
  schoolId: string;
  schoolName: string;
  logoUrl: string | null;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(logoUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(dataUrl: string | null) {
    setBusy(true);
    setError("");
    const res = dataUrl
      ? await fetch(`/api/superadmin/schools/${schoolId}/logo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logoData: dataUrl }),
        })
      : await fetch(`/api/superadmin/schools/${schoolId}/logo`, { method: "DELETE" });
    setBusy(false);

    if (!res.ok) {
      const { message, fields } = await readApiErrors(res, "Could not update the logo.");
      setError(fields.logoData || message);
      return;
    }
    const data = await res.json().catch(() => ({}));
    setCurrent(dataUrl ? data.logoUrl : null);
    router.refresh();
  }

  return <LogoPicker schoolName={schoolName} value={current} onChange={handleChange} busy={busy} error={error} />;
}
