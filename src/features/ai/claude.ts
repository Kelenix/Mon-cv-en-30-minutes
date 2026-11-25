import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { env } from "@/core/env";
import type { AppLocale } from "@/i18n/routing";
import { AiError, type AiUsage, estimateCostUsdMicros } from "./client";
import { deepWithoutDashes, NO_DASH_RULE } from "./typography";

// Appel commun à Claude (docs/architecture.md §7) : flux côté serveur, effort `low`, sortie
// structurée, repli automatique ; motif d'arrêt contrôlé avant toute lecture, sortie validée par
// Zod, consommation mesurée pour le journal des opérations.

export const LANGUAGE_NAMES: Record<AppLocale, string> = {
  fr: "French",
  en: "English",
  it: "Italian",
  es: "Spanish",
  de: "German",
};

/** Un texte de l'utilisateur ne peut pas fermer les balises qui l'encadrent (R06). */
export function escapeData(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export async function callClaude<Schema extends z.ZodType>(
  claude: Anthropic,
  {
    system,
    user,
    schema,
    maxTokens = 16_000,
  }: {
    system: string;
    user: string;
    schema: Schema;
    maxTokens?: number;
  },
): Promise<{ output: z.infer<Schema>; usage: AiUsage }> {
  const { type, schema: jsonSchema } = betaZodOutputFormat(schema);
  const startedAt = Date.now();
  let message;
  try {
    message = await claude.beta.messages
      .stream(
        {
          model: env.ANTHROPIC_MODEL,
          max_tokens: maxTokens,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: `${system}\n\n${NO_DASH_RULE}`,
          messages: [{ role: "user", content: user }],
          output_config: {
            effort: "low",
            format: { type, schema: jsonSchema },
          },
        },
        { signal: AbortSignal.timeout(110_000) },
      )
      .finalMessage();
  } catch (error) {
    const reason =
      error instanceof Anthropic.APIError
        ? `api_${error.status ?? error.name}`
        : "unknown";
    throw new AiError("AI_UNAVAILABLE", reason);
  }

  const cacheRead = message.usage.cache_read_input_tokens ?? 0;
  const usage: AiUsage = {
    model: message.model,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    cacheReadTokens: cacheRead,
    costUsdMicros: estimateCostUsdMicros(message.model, {
      input: message.usage.input_tokens,
      output: message.usage.output_tokens,
      cacheRead,
    }),
    durationMs: Date.now() - startedAt,
  };

  // Refus de toute la chaîne de repli, ou réponse coupée.
  if (message.stop_reason === "refusal") {
    throw new AiError("AI_UNAVAILABLE", "refusal", usage);
  }
  if (message.stop_reason !== "end_turn") {
    throw new AiError(
      "AI_INVALID_OUTPUT",
      `stop_${message.stop_reason}`,
      usage,
    );
  }

  // Après un repli, seul le dernier bloc de texte (celui du modèle qui a répondu) compte.
  let text: string | undefined;
  for (const block of message.content) {
    if (block.type === "text") text = block.text;
  }
  const parsed = schema.safeParse(text && parseJson(text));
  if (!parsed.success) throw new AiError("AI_INVALID_OUTPUT", "schema", usage);

  return { output: deepWithoutDashes(parsed.data), usage };
}
