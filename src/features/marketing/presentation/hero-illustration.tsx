// Illustration vectorielle reprenant les motifs du kit (CV, validation, chronomètre « 30s »), en
// attendant les fichiers officiels (tâche manuelle 8). Décorative : masquée aux lecteurs d'écran.
export function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 420 360"
      aria-hidden="true"
      focusable="false"
      className="h-auto w-full max-w-md"
    >
      <defs>
        <linearGradient id="hero-glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
          <stop
            offset="100%"
            stopColor="var(--brand-cyan)"
            stopOpacity="0.18"
          />
        </linearGradient>
        <filter id="hero-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="12"
            stdDeviation="14"
            floodColor="#0f6fe6"
            floodOpacity="0.16"
          />
        </filter>
      </defs>

      <circle cx="220" cy="180" r="160" fill="url(#hero-glow)" />

      <g filter="url(#hero-shadow)">
        <rect
          x="90"
          y="40"
          width="210"
          height="270"
          rx="22"
          fill="var(--card)"
        />
        <circle cx="140" cy="95" r="26" fill="var(--primary)" />
        <circle cx="140" cy="88" r="9" fill="var(--card)" />
        <path d="M122 110 a18 14 0 0 1 36 0 z" fill="var(--card)" />
        <rect
          x="180"
          y="80"
          width="96"
          height="12"
          rx="6"
          fill="var(--foreground)"
        />
        <rect
          x="180"
          y="100"
          width="70"
          height="10"
          rx="5"
          fill="var(--surface)"
        />
        <rect
          x="114"
          y="146"
          width="162"
          height="12"
          rx="6"
          fill="var(--primary)"
          opacity="0.85"
        />
        <rect
          x="114"
          y="170"
          width="140"
          height="10"
          rx="5"
          fill="var(--surface)"
        />
        <rect
          x="114"
          y="190"
          width="150"
          height="10"
          rx="5"
          fill="var(--surface)"
        />
        <rect
          x="114"
          y="220"
          width="120"
          height="12"
          rx="6"
          fill="var(--primary)"
          opacity="0.55"
        />
        <rect
          x="114"
          y="244"
          width="146"
          height="10"
          rx="5"
          fill="var(--surface)"
        />
        <rect
          x="114"
          y="264"
          width="110"
          height="10"
          rx="5"
          fill="var(--surface)"
        />
      </g>

      <g filter="url(#hero-shadow)">
        <circle cx="300" cy="62" r="26" fill="var(--premium)" />
        <path
          d="M288 62 l8 8 l16 -17"
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <g filter="url(#hero-shadow)">
        <rect
          x="308"
          y="214"
          width="20"
          height="16"
          rx="5"
          fill="var(--foreground)"
        />
        <circle cx="318" cy="282" r="56" fill="var(--foreground)" />
        <circle cx="318" cy="282" r="44" fill="var(--card)" />
        <path
          d="M318 238 A44 44 0 0 1 362 282"
          fill="none"
          stroke="var(--premium)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <text
          x="318"
          y="294"
          textAnchor="middle"
          fontSize="32"
          fontWeight="700"
          fill="var(--foreground)"
          fontFamily="var(--font-poppins), sans-serif"
        >
          30s
        </text>
      </g>
    </svg>
  );
}
