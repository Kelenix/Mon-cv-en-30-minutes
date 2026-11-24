// Mise en forme des chiffres de l'administration, en français (fuseau de Paris).

const TIME_ZONE = "Europe/Paris";

const integer = new Intl.NumberFormat("fr-FR");
const decimal = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});
const dollar = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const percent = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
});

export const formatNumber = (value: number) => integer.format(value);
export const formatDecimal = (value: number) => decimal.format(value);
export const formatEuros = (cents: number) => euro.format(cents / 100);
const smallDollar = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "USD",
  maximumSignificantDigits: 2,
});

/** Montant en dollars ; les très petits coûts (par opération) gardent deux chiffres utiles. */
export function formatDollars(micros: number) {
  const value = micros / 1e6;
  return value !== 0 && Math.abs(value) < 0.01
    ? smallDollar.format(value)
    : dollar.format(value);
}
export const formatPercent = (ratio: number) => percent.format(ratio);

/** Part `part / total`, ou un tiret si le total est nul. */
export function formatShare(part: number, total: number) {
  return total > 0 ? formatPercent(part / total) : "–";
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "–";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeZone: TIME_ZONE,
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "–";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIME_ZONE,
  }).format(new Date(value));
}

/** Jour court d'un axe de graphique (« 24 nov. »). */
export function formatDay(day: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));
}

const relative = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

/** « il y a 3 heures », « hier »… */
export function formatRelative(value: string | Date | null | undefined) {
  if (!value) return "jamais";
  const seconds = (new Date(value).getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return relative.format(Math.round(seconds / size), unit);
    }
  }
  return "à l'instant";
}

export function formatBytes(bytes: number) {
  const units = ["o", "Ko", "Mo", "Go", "To"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${decimal.format(value)} ${units[unit]}`;
}

export function formatDuration(ms: number | null | undefined) {
  if (ms == null) return "–";
  return ms < 1000
    ? `${integer.format(ms)} ms`
    : `${decimal.format(ms / 1000)} s`;
}
