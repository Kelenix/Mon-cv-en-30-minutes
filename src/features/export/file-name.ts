// Nom du fichier exporté (US-16 c.3) : « CV-Prénom-Nom.pdf », accents compris, avec une variante
// sans accent pour les navigateurs anciens (RFC 6266).

export function exportFileName(fullName: string, extension: "pdf" | "docx") {
  const words = fullName
    .normalize("NFC")
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}'-]/gu, ""))
    .filter(Boolean);
  return `${["CV", ...words].join("-")}.${extension}`;
}

export function attachmentHeader(fileName: string) {
  const ascii = fileName
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\x20-\x7e]|"/g, "_");
  const encoded = encodeURIComponent(fileName).replaceAll("'", "%27");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
