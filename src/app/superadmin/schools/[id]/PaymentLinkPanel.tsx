"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle, ExternalLink } from "lucide-react";

export default function PaymentLinkPanel({
  schoolId,
  schoolName,
  whatsapp,
}: {
  schoolId: string;
  schoolName: string;
  whatsapp: string;
}) {
  const [copied, setCopied] = useState(false);

  const subscribeUrl = `${typeof window !== "undefined" ? window.location.origin : "https://verifygate.app"}/admin/subscribe`;

  const waMsg = encodeURIComponent(
    `Hi ${schoolName},\n\nYour VerifyGate school account is ready.\n\nTo activate your subscription, please click the link below and pay via Mobile Money:\n\n${subscribeUrl}\n\nOnce payment is confirmed, your account will be fully active. Contact us if you need any help.\n\n- VerifyGate Team`
  );

  const waLink = `https://wa.me/${whatsapp}?text=${waMsg}`;

  function copy() {
    navigator.clipboard.writeText(subscribeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="space-y-4">
      {/* Link display */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 font-mono truncate">
          {subscribeUrl}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Send via WhatsApp */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Send to School via WhatsApp
        </a>

        {/* Preview link */}
        <a
          href={subscribeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 px-5 py-3 rounded-xl font-medium text-sm transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Preview Page
        </a>
      </div>

      <p className="text-xs text-slate-400">
        The school admin opens this link, enters their MoMo number, and pays.
        Payment is confirmed instantly via Paystack, their account activates automatically.
      </p>
    </div>
  );
}
