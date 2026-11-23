import {
  LegalPageView,
  legalPageMetadata,
} from "@/features/legal/presentation/legal-page";

export function generateMetadata() {
  return legalPageMetadata("cookies", "/cookies");
}

export default function CookiesPage() {
  return <LegalPageView page="cookies" />;
}
