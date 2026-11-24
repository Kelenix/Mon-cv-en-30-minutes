import "server-only";
import { env } from "@/core/env";

/** Adresse e-mail d'un administrateur (`ADMIN_EMAILS`, ADR-040). */
export function isAdminEmail(email: unknown) {
  return (
    typeof email === "string" &&
    env.ADMIN_EMAILS.includes(email.trim().toLowerCase())
  );
}
