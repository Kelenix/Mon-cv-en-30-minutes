"use client";

import { useSearchParams } from "next/navigation";
import { FormAlert } from "@/components/form/form-alert";

/** Confirmation affichée sur l'accueil après la suppression du compte (US-06). */
export function AccountDeletedNotice({ message }: { message: string }) {
  const searchParams = useSearchParams();
  if (searchParams.get("compte") !== "supprime") return null;

  return (
    <div className="container-page pt-6">
      <FormAlert tone="success" message={message} />
    </div>
  );
}
