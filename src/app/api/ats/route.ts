import { extractText, getDocumentProxy } from "unpdf";
import { analyzeCv } from "@/features/ats/analyze";
import { ATS_MAX_BYTES, allowAtsCheck } from "@/features/ats/limits";

/**
 * Test ATS gratuit (ADR-052) : le PDF est lu en mémoire, analysé sans IA, puis oublié. Rien n'est
 * enregistré ; seul un compteur anonyme limite les abus (par adresse IP hachée).
 */
export async function POST(request: Request) {
  if (!(await allowAtsCheck())) {
    return Response.json({ error: "RATE_LIMITED" }, { status: 429 });
  }
  const file = (await request.formData().catch(() => null))?.get("cv");
  if (!(file instanceof File)) {
    return Response.json({ error: "NOT_PDF" }, { status: 400 });
  }
  if (file.size > ATS_MAX_BYTES) {
    return Response.json({ error: "TOO_LARGE" }, { status: 413 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  // Signature « %PDF » au début du fichier.
  if (String.fromCharCode(...bytes.subarray(0, 4)) !== "%PDF") {
    return Response.json({ error: "NOT_PDF" }, { status: 415 });
  }
  try {
    const pdf = await getDocumentProxy(bytes);
    const { totalPages, text } = await extractText(pdf, { mergePages: true });
    return Response.json(analyzeCv({ text, pages: totalPages }), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "UNREADABLE" }, { status: 422 });
  }
}
