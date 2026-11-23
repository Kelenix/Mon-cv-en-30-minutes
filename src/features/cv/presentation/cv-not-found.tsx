import { useTranslations } from "next-intl";
import {
  BRAND_POINTS,
  BrandAside,
  SPLIT_LAYOUT,
} from "@/components/layout/brand-aside";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/** CV absent ou d'un autre compte (la RLS le rend introuvable) : lien vers « Mes CV ». */
export function CvNotFound() {
  const t = useTranslations("cvEditor");
  const tHome = useTranslations("home");
  return (
    <div className={SPLIT_LAYOUT}>
      <div className="grid gap-6 lg:py-16">
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
      <BrandAside points={BRAND_POINTS.map((key) => tHome(key))} />
    </div>
  );
}
