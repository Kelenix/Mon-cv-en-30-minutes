import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/core/env";

// Client Claude unique (docs/architecture.md §7) : délai de 60 s par tentative et une seule
// nouvelle tentative, que le SDK réserve aux erreurs transitoires (429, 5xx, réseau).

let client: Anthropic | undefined;

/**
 * Client de l'API, ou `null` sans clé ou avec `AI_SIMULATION` (tests) : l'IA est alors simulée
 * (tâche manuelle 3).
 */
export function getClaude(): Anthropic | null {
  if (!env.ANTHROPIC_API_KEY || env.AI_SIMULATION) return null;
  client ??= new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    timeout: 60_000,
    maxRetries: 1,
  });
  return client;
}

/** Erreur d'une opération IA, traduite pour l'utilisateur ; les crédits sont alors rendus. */
export class AiError extends Error {
  constructor(
    readonly code: "AI_UNAVAILABLE" | "AI_INVALID_OUTPUT",
    /** Cause technique journalisée (jamais le contenu). */
    readonly reason: string,
    readonly usage?: AiUsage,
  ) {
    super(`${code} (${reason})`);
  }
}

/** Consommation journalisée dans `ai_operations` (NFR-07). */
export type AiUsage = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  costUsdMicros: number;
  durationMs: number;
};

/** Prix par million de tokens, en dollars (= millionièmes de dollar par token). */
const PRICES: Record<
  string,
  { input: number; output: number; cacheRead: number }
> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2 },
};

/** Coût estimé ; un modèle absent du tableau (repli, autre modèle) est estimé au prix d'Opus 5.5. */
export function estimateCostUsdMicros(
  model: string,
  tokens: { input: number; output: number; cacheRead: number },
) {
  const price = PRICES[model] ?? PRICES["claude-opus-5-5"];
  return Math.round(
    tokens.input * price.input +
      tokens.output * price.output +
      tokens.cacheRead * price.cacheRead,
  );
}
