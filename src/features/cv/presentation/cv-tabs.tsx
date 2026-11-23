import { EyeIcon, TargetIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "preview", pathname: "/cv/[id]", Icon: EyeIcon },
  { key: "adapt", pathname: "/cv/[id]/adapter", Icon: TargetIcon },
] as const;

/** Onglets d'un CV (docs/design/flows.md §3.6) : aperçu, puis outils IA (Inc-7 à Inc-9). */
export function CvTabs({
  cvId,
  current,
}: {
  cvId: string;
  current: (typeof TABS)[number]["key"];
}) {
  const t = useTranslations("cvTools.tabs");

  return (
    <nav aria-label={t("label")} className="mx-auto mb-4 w-full max-w-[52rem]">
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
              {t(key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
