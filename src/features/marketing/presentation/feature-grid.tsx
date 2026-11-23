import {
  FileTextIcon,
  IdCardIcon,
  type LucideIcon,
  MailIcon,
  MessagesSquareIcon,
  SparklesIcon,
  TargetIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

type Feature = {
  key:
    | "creation"
    | "experiences"
    | "adaptation"
    | "coverLetter"
    | "linkedin"
    | "interview";
  icon: LucideIcon;
  isFree: boolean;
};

// Les six fonctionnalités du §4.2 ; seule la création du premier CV est gratuite (US-02).
const FEATURES: Feature[] = [
  { key: "creation", icon: FileTextIcon, isFree: true },
  { key: "experiences", icon: SparklesIcon, isFree: false },
  { key: "adaptation", icon: TargetIcon, isFree: false },
  { key: "coverLetter", icon: MailIcon, isFree: false },
  { key: "linkedin", icon: IdCardIcon, isFree: false },
  { key: "interview", icon: MessagesSquareIcon, isFree: false },
];

export function FeatureGrid() {
  const t = useTranslations("home.features");

  return (
    <section
      aria-labelledby="fonctionnalites"
      className="container-page py-16 md:py-24"
    >
      <h2
        id="fonctionnalites"
        className="text-[1.625rem] leading-tight font-bold md:text-4xl"
      >
        {t("title")}
      </h2>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        {t("subtitle")}
      </p>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ key, icon: Icon, isFree }) => (
          <li
            key={key}
            className="flex flex-col rounded-xl bg-card p-6 shadow-card"
          >
            <span className="inline-flex size-12 items-center justify-center rounded-lg bg-surface text-primary">
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <h3 className="mt-4 text-xl font-semibold">
              {t(`items.${key}.title`)}
            </h3>
            <p className="mt-2 flex-1 text-muted-foreground">
              {t(`items.${key}.description`)}
            </p>
            <p className="mt-4 text-sm font-medium text-primary-strong">
              {isFree ? t("freeNote") : t("paidNote")}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
