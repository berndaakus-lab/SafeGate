import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";

// Shared look for admin and parent screens (matches the Import page):
// clear page headings, numbered sections, solid main buttons, readable inputs.

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-5 py-3 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-800 font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-colors disabled:opacity-60";
export const btnSmall =
  "inline-flex items-center justify-center gap-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors disabled:opacity-60";
export const inputBase =
  "w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
export const labelBase = "block text-sm font-semibold text-slate-800 mb-1.5";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-slate-600 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/** A white card with an optional numbered step or icon in its heading. */
export function Section({
  step,
  icon: Icon,
  title,
  hint,
  id,
  children,
  className = "",
}: {
  step?: number;
  icon?: LucideIcon;
  title?: string;
  hint?: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 scroll-mt-20 ${className}`}>
      {title && (
        <div className="flex items-start gap-3 mb-5">
          {step !== undefined ? (
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">{step}</span>
          ) : Icon ? (
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </span>
          ) : null}
          <div className="min-w-0 pt-0.5">
            <h2 className="font-semibold text-slate-900 text-base leading-snug">{title}</h2>
            {hint && <p className="text-sm text-slate-500 mt-0.5">{hint}</p>}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}

const BADGE_TONES = {
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-800",
  purple: "bg-purple-100 text-purple-800",
  slate: "bg-slate-100 text-slate-700",
} as const;

export function Badge({ tone = "slate", children }: { tone?: keyof typeof BADGE_TONES; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function InfoNote({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "amber" }) {
  const styles = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-blue-100 bg-blue-50 text-blue-900";
  const icon = tone === "amber" ? "text-amber-600" : "text-blue-600";
  return (
    <div className={`flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles}`}>
      <Info className={`w-4 h-4 mt-0.5 shrink-0 ${icon}`} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center">
      <span className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-7 h-7" />
      </span>
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{text}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
