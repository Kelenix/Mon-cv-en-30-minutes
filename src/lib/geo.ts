import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Reader, type Response } from "mmdb-lib";

// Pays d'une adresse IP (ADR-040), d'après la base DB-IP « IP to Country Lite » (licence CC BY 4.0,
// https://db-ip.com), embarquée avec le site : aucune requête vers un service extérieur.
const DATABASE = join(
  process.cwd(),
  "node_modules/@ip-location-db/dbip-country-mmdb/dbip-country.mmdb",
);

let reader: Reader<Response> | null | undefined;

function getReader() {
  if (reader === undefined) {
    try {
      reader = new Reader(readFileSync(DATABASE));
    } catch (error) {
      console.error("Base des pays indisponible", (error as Error).message);
      reader = null;
    }
  }
  return reader;
}

/** Code pays ISO à deux lettres, ou `null` (adresse locale, réservée ou inconnue). */
export function countryOf(ip: string | null): string | null {
  if (!ip) return null;
  try {
    const record = getReader()?.get(ip) as { country_code?: string } | null;
    const code = record?.country_code;
    return code && /^[A-Z]{2}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}
