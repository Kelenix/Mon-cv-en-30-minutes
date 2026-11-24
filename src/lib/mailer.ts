import "server-only";
import { createTransport, type Transporter } from "nodemailer";
import { env } from "@/core/env";

export type Email = { to: string; subject: string; html: string; text: string };

let transport: Transporter | undefined;

function getTransport() {
  transport ??= createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 10_000,
  });
  return transport;
}

/** Connexion au serveur SMTP vérifiée (état du système, ADR-040) ; faux sans SMTP configuré. */
export async function verifyMailer() {
  if (!env.SMTP_HOST) return false;
  return getTransport().verify();
}

/**
 * Envoie un e-mail par le serveur SMTP du site (le même que celui de l'authentification). Sans
 * SMTP configuré (développement et tests), l'e-mail est seulement journalisé, sans destinataire.
 */
export async function sendEmail(email: Email) {
  if (!env.SMTP_HOST || !env.SMTP_SENDER_EMAIL) {
    console.info(`E-mail simulé (SMTP non configuré) : ${email.subject}`);
    return;
  }
  await getTransport().sendMail({
    from: { name: env.SMTP_SENDER_NAME, address: env.SMTP_SENDER_EMAIL },
    ...email,
  });
}
