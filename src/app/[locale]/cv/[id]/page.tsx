import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { CvWorkspace } from "@/features/cv/presentation/cv-workspace";
import { UpsellCard } from "@/features/cv/presentation/upsell-card";
import { getOwnCv } from "@/features/cv/repository";
import { pickClientMessages } from "@/i18n/client-messages";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cvEditor");
  return { title: t("metaTitle"), robots: { index: false } };
}

// Aperçu et éditeur d'un CV (US-12 à US-15, docs/design/flows.md §3.6). Aucune publicité.
export default function CvPage({ params }: PageProps<"/[locale]/cv/[id]">) {
  return (
    <div className="container-page py-6 md:py-10">
      <Suspense fallback={<SheetSkeleton />}>
        <CvLoader params={params} />
      </Suspense>
    </div>
  );
}

async function CvLoader({
  params,
}: Pick<PageProps<"/[locale]/cv/[id]">, "params">) {
  const { id } = await params;
  const locale = await getLocale();
  await requireUser(locale, "/cv");
  const cv = await getOwnCv(id);
  const t = await getTranslations("cvEditor");

  // CV absent ou d'un autre compte (la RLS le rend introuvable).
  if (!cv) {
    return (
      <div className="mx-auto grid max-w-xl gap-6 py-10">
        <h1 className="text-[1.75rem] leading-tight font-bold">
          {t("notFound")}
        </h1>
        <Link
          href="/cv"
          className={buttonVariants({ className: "justify-self-start" })}
        >
          {t("myCvs")}
        </Link>
      </div>
    );
  }

  // Intitulés des rubriques dans la langue du CV, quelle que soit celle de l'interface (US-42).
  const sections = await getTranslations({
    locale: cv.language,
    namespace: "cvSections",
  });
  const messages = await pickClientMessages(["cvEditor", "upsell"]);

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <CvWorkspace
          cvId={cv.id}
          title={cv.title}
          language={cv.language}
          initialContent={cv.content}
          sectionTitles={{
            summary: sections("summary"),
            experiences: sections("experiences"),
            skills: sections("skills"),
            education: sections("education"),
            languages: sections("languages"),
          }}
        />
        <div className="xl:sticky xl:top-6">
          <UpsellCard />
        </div>
      </div>
    </NextIntlClientProvider>
  );
}

function SheetSkeleton() {
  return (
    <div aria-hidden="true" className="mx-auto grid w-full max-w-[52rem] gap-4">
      <div className="h-16 rounded-xl bg-surface motion-safe:animate-pulse" />
      <div className="aspect-[210/297] rounded-sm bg-surface motion-safe:animate-pulse" />
    </div>
  );
}
