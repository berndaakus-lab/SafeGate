import Image from "next/image";

const sizes = {
  sm: { box: "w-8 h-8 rounded-lg text-sm", px: 32 },
  md: { box: "w-10 h-10 rounded-xl text-base", px: 40 },
  lg: { box: "w-12 h-12 rounded-2xl text-lg", px: 48 },
  xl: { box: "w-20 h-20 rounded-2xl text-2xl", px: 80 },
};

export default function SchoolLogo({
  name,
  logoUrl,
  size = "md",
}: {
  name: string;
  logoUrl?: string | null;
  size?: keyof typeof sizes;
}) {
  const s = sizes[size];
  if (logoUrl) {
    return (
      <div className={`${s.box} shrink-0 overflow-hidden bg-white border border-slate-100 flex items-center justify-center`}>
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          width={s.px}
          height={s.px}
          unoptimized={logoUrl.startsWith("data:")}
          className="w-full h-full object-contain p-0.5"
        />
      </div>
    );
  }
  return (
    <div className={`${s.box} shrink-0 bg-blue-100 flex items-center justify-center font-bold text-blue-700`}>
      {name.trim()[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
