import type { Lang } from "./i18n";

export function formatDate(iso: string, lang: Lang = "pl"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", { year: "numeric", month: "short", day: "2-digit" });
}

export function formatMm(value: number, digits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)} mm`;
}

export function formatPct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatPln(value: number, lang: Lang = "pl", digits = 0): string {
  return new Intl.NumberFormat(lang === "pl" ? "pl-PL" : "en-GB", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: digits,
  }).format(value);
}
