import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

export type ValueKind = "currency" | "percent" | "plain";

export interface ColumnMeaning {
  /**
   * Phrase for use mid-sentence, e.g. "annual revenue". When the name can't
   * be turned into a clean phrase (a full question, very long text), this is
   * the original name in quotes.
   */
  label: string;
  /** True when `label` is an inferred plain-language phrase. */
  inferred: boolean;
  kind: ValueKind;
}

// Words that signal money. Matched against whole words of the column name.
const CURRENCY_WORDS = new Set([
  "revenue", "revenues", "income", "salary", "salaries", "wage", "wages", "pay",
  "payment", "payments", "price", "prices", "pricing", "cost", "costs", "spend",
  "spending", "spent", "budget", "budgets", "amount", "fee", "fees", "profit",
  "profits", "sales", "earnings", "compensation", "arr", "mrr", "ltv", "usd",
  "dollars", "dollar", "invoice", "billing", "donation", "donations", "funding",
]);

const PERCENT_WORDS = new Set(["pct", "percent", "percentage"]);

// Filler words dropped from the phrase ("annual_revenue_usd" → "annual revenue").
const NOISE_WORDS = new Set(["usd", "amt", "val", "value", "num", "no", "field", "col", "column"]);

// Words kept uppercase.
const ACRONYMS = new Set(["nps", "id", "csat", "ces", "arr", "mrr", "ltv", "roi", "hr", "it", "ux", "ui"]);

const MAX_PHRASE_WORDS = 5;

function words(name: string): string[] {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase → camel Case
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Infers what a column represents from its name: a readable phrase for
 * sentences and whether its values are money or percentages.
 */
export function interpretColumn(name: string): ColumnMeaning {
  const tokens = words(name);
  const kind: ValueKind = tokens.some((t) => CURRENCY_WORDS.has(t))
    ? "currency"
    : tokens.some((t) => PERCENT_WORDS.has(t))
      ? "percent"
      : "plain";

  // Full questions or long free text: leave as written.
  const looksLikeQuestion =
    /\?/.test(name) || (/\s/.test(name.trim()) && tokens.length > MAX_PHRASE_WORDS);
  const cleaned = tokens
    .filter((t, i) => !(i === 0 && /^q\d+$/.test(t))) // "q3_satisfaction" → "satisfaction"
    .filter((t) => !NOISE_WORDS.has(t) && !PERCENT_WORDS.has(t) && !/^\d+$/.test(t));

  if (looksLikeQuestion || cleaned.length === 0 || cleaned.length > MAX_PHRASE_WORDS) {
    return { label: `"${name.trim()}"`, inferred: false, kind };
  }

  const label = cleaned.map((t) => (ACRONYMS.has(t) ? t.toUpperCase() : t)).join(" ");
  return { label, inferred: true, kind };
}

/** Formats a value according to what the column represents. */
export function formatValue(n: number, kind: ValueKind): string {
  if (kind === "currency") return formatCurrency(n);
  if (kind === "percent") return formatPercent(n);
  return formatNumber(n);
}

/** Capitalizes the first letter (for a label at the start of a sentence). */
export function capitalize(s: string): string {
  return s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
