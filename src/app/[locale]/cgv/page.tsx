import {
  LegalPageView,
  legalPageMetadata,
} from "@/features/legal/presentation/legal-page";

export function generateMetadata() {
  return legalPageMetadata("terms", "/cgv");
}

export default function TermsPage() {
  return <LegalPageView page="terms" />;
}
