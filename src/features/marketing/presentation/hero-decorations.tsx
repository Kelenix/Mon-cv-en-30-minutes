// Formes décoratives de l'accueil, placées dans les marges et entre les deux colonnes pour ne
// pas couvrir le texte ni l'illustration (ADR-025). Purement visuelles, ignorées par les
// lecteurs d'écran, sans animation. Couleurs de la charte ; le cyan et le jaune restent
// décoratifs (design system §2).
export function HeroDecorations() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
    >
      {/* Grille de « + », marge gauche en haut. */}
      <svg
        viewBox="0 0 64 104"
        className="absolute top-[6%] left-[2%] hidden h-24 w-16 text-primary/25 md:block 2xl:left-[4%] 2xl:h-32 2xl:w-20"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        {[12, 52].flatMap((x) =>
          [12, 52, 92].map((y) => (
            <path key={`${x}-${y}`} d={`M${x - 9} ${y}h18M${x} ${y - 9}v18`} />
          )),
        )}
      </svg>

      {/* Croix en contour, coin supérieur droit. */}
      <svg
        viewBox="0 0 32 32"
        className="absolute top-[4%] right-[4%] hidden size-7 text-brand-cyan sm:block lg:size-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      >
        <path d="M6 3 16 13 26 3l3 3-10 10 10 10-3 3-10-10L6 29l-3-3 10-10L3 6Z" />
      </svg>

      {/* Petit anneau, entre les deux colonnes en bas. */}
      <svg
        viewBox="0 0 20 20"
        className="absolute bottom-[4%] left-[48%] hidden size-6 text-premium xl:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <circle cx="10" cy="10" r="7.5" />
      </svg>

      {/* Trait arrondi incliné, entre les deux colonnes en haut. */}
      <svg
        viewBox="0 0 64 64"
        className="absolute top-[8%] left-[47%] hidden size-14 text-primary/40 xl:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      >
        <rect
          x="26"
          y="-2"
          width="12"
          height="68"
          rx="6"
          transform="rotate(-45 32 32)"
        />
      </svg>

      {/* Traits verticaux, marge gauche en bas. */}
      <svg
        viewBox="0 0 100 44"
        className="absolute bottom-[5%] left-[4%] hidden h-11 w-24 text-brand-cyan/35 md:block"
        stroke="currentColor"
        strokeWidth="2"
      >
        {[2, 26, 50, 74, 98].map((x) => (
          <path key={x} d={`M${x} 0v44`} />
        ))}
      </svg>

      {/* Arcs concentriques, coin inférieur droit, coupés par le bas de la section. */}
      <svg
        viewBox="0 0 200 60"
        className="absolute right-[3%] -bottom-1 h-16 w-52 text-brand-cyan/40 lg:h-24 lg:w-80"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M4 60a96 56 0 0 1 192 0" />
        <path d="M24 60a76 42 0 0 1 152 0" />
      </svg>
    </div>
  );
}
