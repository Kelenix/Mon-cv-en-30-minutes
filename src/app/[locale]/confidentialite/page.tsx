import {
  LegalPageView,
  legalPageMetadata,
} from "@/features/legal/presentation/legal-page";

export function generateMetadata() {
  return legalPageMetadata("privacy", "/confidentialite");
}

export default function PrivacyPage() {
  return <LegalPageView page="privacy" />;
}
