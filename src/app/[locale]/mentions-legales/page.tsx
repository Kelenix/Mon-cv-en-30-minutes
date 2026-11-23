import {
  LegalPageView,
  legalPageMetadata,
} from "@/features/legal/presentation/legal-page";

export function generateMetadata() {
  return legalPageMetadata("legalNotice", "/mentions-legales");
}

export default function LegalNoticePage() {
  return <LegalPageView page="legalNotice" />;
}
