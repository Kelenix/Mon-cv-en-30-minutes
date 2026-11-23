import { useTranslations } from "next-intl";
import {
  BRAND_POINTS,
  BrandAside,
  SPLIT_LAYOUT,
} from "@/components/layout/brand-aside";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  const tHome = useTranslations("home");

  return (
    <section className="container-page py-12 md:py-16">
      <div className={SPLIT_LAYOUT}>
        <div className="flex flex-col items-start gap-4 lg:py-16">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
          <Link href="/" className={buttonVariants()}>
            {t("backHome")}
          </Link>
        </div>
        <BrandAside points={BRAND_POINTS.map((key) => tHome(key))} />
      </div>
    </section>
  );
}
