import SchoolLogo from "@/components/SchoolLogo";

/**
 * The school the signed-in person belongs to, large enough to read at a glance
 * on every admin, teacher, guard and parent screen.
 */
export default function SchoolBanner({
  name,
  logoUrl,
  dark = false,
}: {
  name: string | null | undefined;
  logoUrl?: string | null;
  dark?: boolean;
}) {
  const school = name?.trim();
  if (!school) return null;

  return (
    <div
      className={
        dark
          ? "flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-4 bg-slate-800 border-b border-slate-700"
          : "flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-4 bg-blue-700 text-white"
      }
    >
      <SchoolLogo name={school} logoUrl={logoUrl} size="banner" />
      <div className="min-w-0">
        <p className={`text-[11px] font-semibold uppercase tracking-widest ${dark ? "text-slate-400" : "text-blue-200"}`}>
          Signed in to
        </p>
        <p className="text-xl sm:text-2xl font-extrabold leading-tight text-white break-words">{school}</p>
      </div>
    </div>
  );
}
