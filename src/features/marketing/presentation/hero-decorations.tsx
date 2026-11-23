// Formes décoratives réparties sur toute la largeur de l'accueil (structure demandée par
// l'utilisateur) : positions en pourcentage pour occuper les grands écrans, tailles qui
// grandissent avec l'écran. Purement visuelles, ignorées par les lecteurs d'écran, sans
// animation. Couleurs de la charte ; le cyan et le jaune restent décoratifs (design system §2).
export function HeroDecorations() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
    >
      {/* Grille de « + » en haut à gauche du titre. */}
      <svg
        viewBox="0 0 64 104"
        className="absolute top-[12%] left-[7%] hidden h-24 w-16 text-primary/25 md:block lg:h-32 lg:w-20 2xl:h-40 2xl:w-24"
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

      {/* Croix en contour, en haut à droite. */}
      <svg
        viewBox="0 0 32 32"
        className="absolute top-[6%] right-[8%] size-8 text-brand-cyan md:top-[10%] lg:size-10 2xl:size-12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      >
        <path d="M6 3 16 13 26 3l3 3-10 10 10 10-3 3-10-10L6 29l-3-3 10-10L3 6Z" />
      </svg>

      {/* Petit anneau, en bas à gauche. */}
      <svg
        viewBox="0 0 20 20"
        className="absolute bottom-[22%] left-[14%] hidden size-5 text-premium md:block lg:size-7 2xl:size-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <circle cx="10" cy="10" r="7.5" />
      </svg>

      {/* Trait arrondi incliné, à droite du bouton. */}
      <svg
        viewBox="0 0 64 64"
        className="absolute right-[12%] bottom-[26%] hidden size-16 text-primary/50 md:block lg:size-20 2xl:size-24"
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

      {/* Traits verticaux, en bas. */}
      <svg
        viewBox="0 0 100 44"
        className="absolute right-[32%] bottom-[6%] hidden h-11 w-24 text-brand-cyan/30 md:block lg:h-14 lg:w-28 2xl:h-16 2xl:w-32"
        stroke="currentColor"
        strokeWidth="2"
      >
        {[2, 26, 50, 74, 98].map((x) => (
          <path key={x} d={`M${x} 0v44`} />
        ))}
      </svg>

      {/* Arcs concentriques coupés par le bas de la section. */}
      <svg
        viewBox="0 0 200 60"
        className="absolute right-[5%] -bottom-1 h-16 w-52 text-brand-cyan/40 lg:h-24 lg:w-80 2xl:h-28 2xl:w-96"
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
