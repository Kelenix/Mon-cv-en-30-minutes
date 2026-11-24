import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getCurrentUser } from "@/features/auth/session";
import { isAdminEmail } from "./admins";

/**
 * Administrateur connecté (ADR-040), sinon page introuvable : l'existence de l'espace n'est pas
 * révélée. Le proxy fait déjà ce contrôle ; chaque page le refait.
 */
export const requireAdmin = cache(async () => {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) notFound();
  return user;
});

/** Pour les actions : l'administrateur connecté, ou `null`. */
export async function currentAdmin() {
  const user = await getCurrentUser();
  return user && isAdminEmail(user.email) ? user : null;
}
