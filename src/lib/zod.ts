import { z } from "zod";

// Zod sans compilation à la volée : sinon il essaie `new Function` pour accélérer ses contrôles,
// ce que la CSP du site interdit (pas d'`unsafe-eval`) et que le navigateur signale comme une
// violation, même rattrapée. Tout le code du site importe Zod depuis ce fichier.
z.config({ jitless: true });

export { z };
