/**
 * Prénom et nom proposés à la première connexion, d'après les métadonnées fournies par Google
 * (`given_name` et `family_name`, sinon le nom complet découpé au premier espace).
 */
export function namesFromMetadata(metadata: Record<string, unknown>) {
  const text = (key: string) => {
    const value = metadata[key];
    return typeof value === "string" ? value.trim() : "";
  };
  const fullName = text("full_name") || text("name");
  const [first = "", ...rest] = fullName.split(/\s+/).filter(Boolean);

  return {
    firstName: (text("given_name") || first).slice(0, 60),
    lastName: (text("family_name") || rest.join(" ")).slice(0, 60),
  };
}
