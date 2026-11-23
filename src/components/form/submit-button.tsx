"use client";

import { Loader2Icon } from "lucide-react";
import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { useHydrated } from "./use-hydrated";

/**
 * Bouton d'envoi d'un formulaire (US-37, design system §7) : pendant l'action, indicateur de
 * chargement, texte conservé et bouton désactivé, ce qui empêche un double envoi. Désactivé
 * aussi tant que la page n'est pas interactive : un clic serait perdu.
 */
export function SubmitButton({
  children,
  disabled,
  ...props
}: Omit<ComponentProps<typeof Button>, "type">) {
  const { pending } = useFormStatus();
  const hydrated = useHydrated();

  return (
    <Button
      type="submit"
      disabled={!hydrated || pending || disabled}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending ? (
        <Loader2Icon aria-hidden="true" className="motion-safe:animate-spin" />
      ) : null}
      {children}
    </Button>
  );
}
