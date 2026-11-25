import type { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/features/auth/session";
import { getActivePlan } from "@/features/billing/subscription";
import { getOwnCv } from "@/features/cv/repository";
import { renderCvDocx } from "@/features/export/cv-docx";
import { renderCvPdf } from "@/features/export/cv-pdf";
import { attachmentHeader, exportFileName } from "@/features/export/file-name";
import { getOwnCvPhoto } from "@/features/cv/photo";
import { canDownloadTemplate, TEMPLATE_INFO } from "@/features/cv/templates";
import { canExportWithoutWatermark } from "@/features/plans/entitlements";

const CONTENT_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

/**
 * Export du CV (US-16, US-17, docs/system-design.md §6.4) : session, CV lu par le client soumis à
 * la RLS (404 s'il est absent ou d'un autre compte), droits vérifiés ici ; le filigrane est posé
 * côté serveur, le DOCX et le PDF d'un modèle payant refusés sans droit. `apercu=1` : PDF affiché
 * dans le navigateur, marqué « Aperçu » pour un modèle payant essayé sans droit (ADR-050).
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/cv/[id]/export">,
) {
  const format = request.nextUrl.searchParams.get("format");
  if (format !== "pdf" && format !== "docx") {
    return new Response(null, { status: 400 });
  }
  const preview =
    format === "pdf" && request.nextUrl.searchParams.get("apercu") === "1";
  if (!(await getCurrentUser())) return new Response(null, { status: 401 });

  const cv = await getOwnCv((await params).id);
  if (!cv) return new Response(null, { status: 404 });

  const unlocked = canExportWithoutWatermark(
    await getActivePlan(),
    cv.proUnlocked,
  );
  const templateAllowed = canDownloadTemplate(cv.template, unlocked);
  if (
    (format === "docx" && !unlocked) ||
    (format === "pdf" && !templateAllowed && !preview)
  ) {
    return new Response(null, { status: 403 });
  }

  // Intitulés et filigrane dans la langue du CV, quelle que soit celle de l'interface (US-42).
  const t = await getTranslations({ locale: cv.language });
  const texts = {
    language: cv.language,
    titles: {
      summary: t("cvSections.summary"),
      experiences: t("cvSections.experiences"),
      skills: t("cvSections.skills"),
      education: t("cvSections.education"),
      languages: t("cvSections.languages"),
    },
    watermark: unlocked
      ? undefined
      : t("cvDocument.watermark", { brand: t("brand.name") }),
    preview: templateAllowed ? undefined : t("cvDocument.preview"),
  };
  // Le DOCX reste un document Word simple, lisible par les logiciels de recrutement.
  const file =
    format === "pdf"
      ? await renderCvPdf(cv.content, texts, {
          template: cv.template,
          photo: TEMPLATE_INFO[cv.template].photo
            ? ((await getOwnCvPhoto(cv.id)) ?? undefined)
            : undefined,
        })
      : await renderCvDocx(cv.content, texts);

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": CONTENT_TYPES[format],
      "Content-Disposition": attachmentHeader(
        exportFileName(cv.content.header.fullName, format),
        preview ? "inline" : "attachment",
      ),
      "Cache-Control": "private, no-store",
    },
  });
}
