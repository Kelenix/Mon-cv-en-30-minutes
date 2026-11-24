import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="grid gap-3 py-12">
      <h1 className="text-2xl font-bold">Page introuvable</h1>
      <p className="text-muted-foreground">
        Ce compte ou cette page n&apos;existe pas.
      </p>
      <Link
        href="/admin"
        className="font-medium text-primary-strong hover:underline"
      >
        Retour à la vue d&apos;ensemble
      </Link>
    </div>
  );
}
