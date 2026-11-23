import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CvTabs } from "@/features/cv/presentation/cv-tabs";
import { getOwnCv } from "@/features/cv/repository";

// Pages d'un CV : les onglets font partie de la mise en page commune et restent affichés d'un
// onglet à l'autre ; seul le contenu de l'onglet change (docs/design/design-system.md §5).
export default function CvLayout({
  children,
  params,
}: LayoutProps<"/[locale]/cv/[id]">) {
  return (
    <div className="container-page py-6 md:py-10">
      <Suspense fallback={<div aria-hidden="true" className="mb-4 min-h-11" />}>
        <Tabs params={params} />
      </Suspense>
      {children}
    </div>
  );
}

async function Tabs({
  params,
}: Pick<LayoutProps<"/[locale]/cv/[id]">, "params">) {
  const { id } = await params;
  // CV introuvable (ou visiteur) : pas d'onglets, la page affiche le message.
  const cv = await getOwnCv(id);
  if (!cv) return null;
  const t = await getTranslations("cvTools.tabs");
  return (
    <CvTabs
      cvId={cv.id}
      label={t("label")}
      labels={{
        preview: t("preview"),
        adapt: t("adapt"),
        linkedin: t("linkedin"),
        letter: t("letter"),
        interview: t("interview"),
      }}
    />
  );
}
