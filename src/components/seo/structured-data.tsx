/**
 * Données structurées schema.org (JSON-LD, US-39 c.1). « < » est échappé : le contenu reste une
 * donnée inerte, même s'il contenait une balise.
 */
export function StructuredData({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON produit par le serveur à partir du catalogue, sans donnée saisie par l'utilisateur.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
