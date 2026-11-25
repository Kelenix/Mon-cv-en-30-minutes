import type { ReactNode } from "react";
import { joinFilled, period, titleLine } from "../content";
import type { CvContent } from "../schemas";

// Rendu en lecture du CV (US-12) : une seule colonne, du texte réel, des intitulés standard
// (H34). Les mêmes blocs servent à l'aperçu et, à l'Inc-5, aux exports.

export function HeaderView({ header }: { header: CvContent["header"] }) {
  return (
    <div>
      <p className="text-[1.75em] leading-tight font-bold">{header.fullName}</p>
      {header.title ? (
        <p className="mt-1 text-[1.15em] font-semibold text-cv-accent">
          {header.title}
        </p>
      ) : null}
      <p className="mt-2">
        {joinFilled([header.email, header.phone, header.city], " · ")}
      </p>
    </div>
  );
}

export function ExperiencesView({
  items,
  action,
}: {
  items: CvContent["experiences"];
  /** Commande affichée sous chaque expérience (aperçu modifiable, hors exports). */
  action?: (item: CvContent["experiences"][number]) => ReactNode;
}) {
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <div key={item.id}>
          <p className="font-bold">{titleLine(item.role, item.company)}</p>
          <p className="text-cv-muted">
            {joinFilled(
              [item.location, period(item.startDate, item.endDate)],
              " · ",
            )}
          </p>
          {item.bullets.length > 0 ? (
            <ul className="mt-1 list-disc ps-5">
              {item.bullets.map((bullet, index) => (
                <li key={index}>{bullet}</li>
              ))}
            </ul>
          ) : null}
          {action?.(item)}
        </div>
      ))}
    </div>
  );
}

export function EducationView({ items }: { items: CvContent["education"] }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.id}>
          <p className="font-bold">{titleLine(item.degree, item.school)}</p>
          {item.year ? <p className="text-cv-muted">{item.year}</p> : null}
          {item.details ? <p>{item.details}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function LanguagesView({ items }: { items: CvContent["languages"] }) {
  return (
    <ul className="grid gap-1">
      {items.map((item) => (
        <li key={item.id}>
          {item.level ? `${item.name} (${item.level})` : item.name}
        </li>
      ))}
    </ul>
  );
}
