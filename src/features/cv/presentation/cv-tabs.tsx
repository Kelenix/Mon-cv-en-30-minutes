"use client";

import {
  EyeIcon,
  IdCardIcon,
  MailIcon,
  MessagesSquareIcon,
  TargetIcon,
} from "lucide-react";
import { useSelectedLayoutSegment } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "preview", pathname: "/cv/[id]", Icon: EyeIcon },
  { key: "adapt", pathname: "/cv/[id]/adapter", Icon: TargetIcon },
  { key: "linkedin", pathname: "/cv/[id]/linkedin", Icon: IdCardIcon },
  { key: "letter", pathname: "/cv/[id]/lettre", Icon: MailIcon },
  {
    key: "interview",
    pathname: "/cv/[id]/entretien",
    Icon: MessagesSquareIcon,
  },
] as const;

export type CvTabKey = (typeof TABS)[number]["key"];

/** Onglet actif d'après le dossier de la page (noms internes, quelle que soit la langue). */
const TAB_BY_SEGMENT: Record<string, CvTabKey> = {
  adapter: "adapt",
  linkedin: "linkedin",
  lettre: "letter",
  entretien: "interview",
};

/**
 * Onglets d'un CV (docs/design/flows.md §3.6), dans la mise en page commune aux pages du CV : ils
 * restent affichés d'un onglet à l'autre, seul l'onglet actif change.
 */
export function CvTabs({
  cvId,
  label,
  labels,
}: {
  cvId: string;
  label: string;
  labels: Record<CvTabKey, string>;
}) {
  const segment = useSelectedLayoutSegment();
  const current = (segment && TAB_BY_SEGMENT[segment]) || "preview";

  return (
    <nav aria-label={label} className="mb-4 w-full">
      {/* Trait de base dessiné à l'intérieur de la liste : l'onglet actif le recouvre sans
          déborder (aucun ascenseur vertical). */}
      <ul className="flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--color-border)]">
        {TABS.map(({ key, pathname, Icon }) => (
          <li key={key}>
            <Link
              href={{ pathname, params: { id: cvId } }}
              aria-current={key === current ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 border-b-2 px-4 font-semibold whitespace-nowrap transition-colors",
                key === current
                  ? "border-primary text-primary-strong"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon aria-hidden="true" className="size-5" />
              {labels[key]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
