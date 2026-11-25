import { z } from "@/lib/zod";
import { routing } from "./routing";

/** Langue transmise par un formulaire : les actions serveur la reçoivent explicitement. */
export const localeSchema = z.enum(routing.locales);
