export default function StoryIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 380"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sky/background blob */}
      <circle cx="210" cy="170" r="170" fill="#eff6ff" />

      {/* Sun */}
      <circle cx="350" cy="60" r="26" fill="#fde68a" />

      {/* Ground */}
      <rect x="0" y="330" width="420" height="50" fill="#e2e8f0" />
      <rect x="0" y="326" width="420" height="6" fill="#cbd5e1" />

      {/* Gate posts */}
      <rect x="280" y="120" width="18" height="210" rx="3" fill="#1d4ed8" />
      <rect x="380" y="120" width="18" height="210" rx="3" fill="#1d4ed8" />
      {/* Gate top bar */}
      <rect x="272" y="108" width="134" height="16" rx="4" fill="#1e40af" />
      {/* Gate vertical bars */}
      <rect x="316" y="140" width="8" height="180" fill="#93c5fd" />
      <rect x="340" y="140" width="8" height="180" fill="#93c5fd" />
      <rect x="364" y="140" width="8" height="180" fill="#93c5fd" />
      {/* Shield emblem on gate */}
      <circle cx="339" cy="96" r="18" fill="#1d4ed8" />
      <path d="M331 90 h16 v10 l-8 10 l-8 -10 z" fill="#ffffff" />

      {/* School building hint behind gate */}
      <rect x="300" y="40" width="80" height="70" rx="4" fill="#dbeafe" />
      <rect x="320" y="60" width="14" height="18" fill="#93c5fd" />
      <rect x="346" y="60" width="14" height="18" fill="#93c5fd" />
      <polygon points="295,40 340,15 385,40" fill="#bfdbfe" />

      {/* ── Girl walking toward gate ── */}
      <g>
        {/* Back leg */}
        <path d="M150 260 q-4 30 -10 55 l14 3 q8 -28 12 -50 z" fill="#1e293b" />
        {/* Front leg */}
        <path d="M168 260 q6 28 4 55 l14 -1 q4 -30 -2 -58 z" fill="#1e293b" />
        {/* Shoes */}
        <ellipse cx="146" cy="320" rx="12" ry="6" fill="#334155" />
        <ellipse cx="186" cy="318" rx="12" ry="6" fill="#334155" />

        {/* Dress / uniform */}
        <path d="M140 200 q20 -14 44 0 l10 62 q-32 14 -64 0 z" fill="#1d4ed8" />
        {/* Collar */}
        <path d="M152 200 l10 14 l10 -14 z" fill="#ffffff" />

        {/* Backpack */}
        <rect x="112" y="205" width="30" height="42" rx="8" fill="#f59e0b" />
        <rect x="122" y="198" width="12" height="14" rx="4" fill="#f59e0b" />

        {/* Back arm */}
        <path d="M146 210 q-14 10 -16 32" stroke="#1d4ed8" strokeWidth="10" strokeLinecap="round" fill="none" />
        {/* Front arm (swinging) */}
        <path d="M182 210 q16 6 22 26" stroke="#1d4ed8" strokeWidth="10" strokeLinecap="round" fill="none" />
        {/* Hands */}
        <circle cx="131" cy="243" r="6" fill="#7c4a2d" />
        <circle cx="204" cy="235" r="6" fill="#7c4a2d" />

        {/* Neck */}
        <rect x="157" y="185" width="10" height="12" fill="#7c4a2d" />

        {/* Head */}
        <circle cx="162" cy="168" r="24" fill="#8a5a3a" />
        {/* Hair */}
        <path d="M138 162 q4 -30 24 -30 q24 0 26 26 q-6 -10 -18 -10 q2 8 -2 14 q-4 -10 -14 -12 q0 8 -6 12 q-6 -4 -10 0 z" fill="#1c1917" />
        {/* Pigtail buns */}
        <circle cx="132" cy="150" r="9" fill="#1c1917" />
        <circle cx="192" cy="150" r="9" fill="#1c1917" />
        {/* Face */}
        <circle cx="155" cy="168" r="2.5" fill="#1c1917" />
        <circle cx="170" cy="168" r="2.5" fill="#1c1917" />
        <path d="M156 178 q6 5 12 0" stroke="#1c1917" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>

      {/* Motion dust */}
      <ellipse cx="100" cy="322" rx="18" ry="4" fill="#cbd5e1" opacity="0.6" />
    </svg>
  );
}
