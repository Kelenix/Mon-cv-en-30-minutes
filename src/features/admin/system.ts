import "server-only";
import { readdir, stat, statfs } from "node:fs/promises";
import { cpus, freemem, loadavg, totalmem } from "node:os";
import { join } from "node:path";
import { env } from "@/core/env";
import { getClaude } from "@/features/ai/client";
import { getStripe } from "@/features/billing/stripe";
import { verifyMailer } from "@/lib/mailer";
import { createAdminClient } from "@/lib/supabase/admin";

// État du système (ADR-040) : chaque service est interrogé en direct, avec un délai court ;
// aucun secret n'est affiché.

export type CheckState = "ok" | "warning" | "error" | "off";
export type Check = {
  name: string;
  state: CheckState;
  detail: string;
  latencyMs?: number;
};

const TIMEOUT_MS = 5000;

async function timed<T>(
  run: () => Promise<T>,
): Promise<{ value?: T; error?: string; ms: number }> {
  const start = performance.now();
  try {
    const value = await Promise.race([
      run(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("délai dépassé")), TIMEOUT_MS),
      ),
    ]);
    return { value, ms: Math.round(performance.now() - start) };
  } catch (error) {
    return {
      error: (error as Error).message.slice(0, 160),
      ms: Math.round(performance.now() - start),
    };
  }
}

async function databaseCheck(): Promise<Check> {
  const result = await timed(async () => {
    const { error } = await createAdminClient()
      .from("profiles")
      .select("id", { head: true, count: "estimated" });
    if (error) throw new Error(error.message);
  });
  return {
    name: "Base de données",
    state: result.error ? "error" : "ok",
    detail: result.error ?? "PostgreSQL répond",
    latencyMs: result.ms,
  };
}

async function authCheck(): Promise<Check> {
  const result = await timed(async () => {
    const response = await fetch(
      `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`,
      { headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as { version?: string };
  });
  return {
    name: "Authentification",
    state: result.error ? "error" : "ok",
    detail: result.error ?? `GoTrue ${result.value?.version ?? ""}`.trim(),
    latencyMs: result.ms,
  };
}

async function stripeCheck(): Promise<Check> {
  const stripe = getStripe();
  if (!stripe) {
    return {
      name: "Paiements Stripe",
      state: "warning",
      detail: "Clés absentes : paiement indisponible",
    };
  }
  const mode = env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
    ? "mode réel"
    : "mode test";
  const result = await timed(() => stripe.balance.retrieve());
  return {
    name: "Paiements Stripe",
    state: result.error ? "error" : mode === "mode réel" ? "ok" : "warning",
    detail: result.error ?? `Stripe répond (${mode})`,
    latencyMs: result.ms,
  };
}

async function aiCheck(): Promise<Check> {
  const claude = getClaude();
  if (!claude) {
    return {
      name: "IA (Claude)",
      state: "warning",
      detail: "Clé absente : IA simulée",
    };
  }
  const result = await timed(() =>
    claude.models.retrieve(env.ANTHROPIC_MODEL, {}, { timeout: TIMEOUT_MS }),
  );
  return {
    name: "IA (Claude)",
    state: result.error ? "error" : "ok",
    detail: result.error ?? `Modèle ${env.ANTHROPIC_MODEL} disponible`,
    latencyMs: result.ms,
  };
}

async function mailCheck(): Promise<Check> {
  if (!env.SMTP_HOST) {
    return {
      name: "E-mails (SMTP)",
      state: "warning",
      detail: "SMTP absent : e-mails seulement journalisés",
    };
  }
  const result = await timed(verifyMailer);
  return {
    name: "E-mails (SMTP)",
    state: result.error ? "error" : "ok",
    detail: result.error ?? `${env.SMTP_HOST} accepte la connexion`,
    latencyMs: result.ms,
  };
}

function configurationChecks(): Check[] {
  return [
    {
      name: "Protection anti-robots",
      state: env.TURNSTILE_SECRET_KEY ? "ok" : "warning",
      detail: env.TURNSTILE_SECRET_KEY
        ? "Cloudflare Turnstile actif"
        : "Turnstile non configuré",
    },
    {
      name: "Connexion Google",
      state: env.GOOGLE_AUTH_ENABLED ? "ok" : "off",
      detail: env.GOOGLE_AUTH_ENABLED ? "Activée" : "Désactivée",
    },
    {
      name: "Publicités",
      state: env.ADS_MODE === "off" ? "off" : "ok",
      detail: {
        off: "Désactivées",
        simulation: "Mode simulation",
        google: "Google Ad Manager",
      }[env.ADS_MODE],
    },
  ];
}

/** Tous les services, interrogés en parallèle. */
export async function serviceChecks() {
  const live = await Promise.all([
    databaseCheck(),
    authCheck(),
    stripeCheck(),
    aiCheck(),
    mailCheck(),
  ]);
  return [...live, ...configurationChecks()];
}

// Sauvegardes de la nuit, montées en lecture seule dans le conteneur (deploy/docker-compose.yml).
const BACKUPS_DIR = "/backups";

export type BackupStatus =
  | { mounted: false }
  | {
      mounted: true;
      count: number;
      latest: { name: string; at: string; bytes: number } | null;
    };

export async function backupStatus(): Promise<BackupStatus> {
  try {
    const names = (await readdir(BACKUPS_DIR)).filter((name) =>
      name.endsWith(".sql.gz"),
    );
    const files = await Promise.all(
      names.map(async (name) => {
        const info = await stat(join(BACKUPS_DIR, name));
        return { name, at: info.mtime.toISOString(), bytes: info.size };
      }),
    );
    files.sort((a, b) => b.at.localeCompare(a.at));
    return { mounted: true, count: files.length, latest: files[0] ?? null };
  } catch {
    return { mounted: false };
  }
}

/** Ressources du serveur vues depuis le conteneur du site. */
export async function serverStatus() {
  const disk = await statfs("/").catch(() => null);
  return {
    version: env.APP_VERSION ?? "développement",
    node: process.version,
    startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    checkedAt: new Date().toISOString(),
    processMemory: process.memoryUsage().rss,
    memory: { total: totalmem(), free: freemem() },
    load: loadavg(),
    cpus: cpus().length,
    disk: disk
      ? { total: disk.blocks * disk.bsize, free: disk.bavail * disk.bsize }
      : null,
  };
}
