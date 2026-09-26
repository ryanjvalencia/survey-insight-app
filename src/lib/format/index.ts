/**
 * Compact number for axis ticks and chart labels: 950 → "950",
 * 25_507 → "25.5K", 1_200_000 → "1.2M". Keeps at most one decimal and drops
 * a trailing ".0".
 */
export function compactNumber(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const units: Array<[number, string]> = [
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (let i = 0; i < units.length; i++) {
    const [size, suffix] = units[i];
    if (abs >= size) {
      const scaled = Math.round((abs / size) * 10) / 10;
      // 999_950 rounds to "1000K" — promote to the next unit instead.
      if (scaled >= 1000 && i > 0) {
        const [bigger, biggerSuffix] = units[i - 1];
        return `${sign}${trimZero(Math.round((abs / bigger) * 10) / 10)}${biggerSuffix}`;
      }
      return `${sign}${trimZero(scaled)}${suffix}`;
    }
  }
  return `${sign}${trimZero(Math.round(abs * 10) / 10)}`;
}

function trimZero(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** Whole-number count with thousands separators: 10000 → "10,000". */
export function formatCount(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/** Full-precision number for tooltips and tables: up to 2 decimals. */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** Percentage with at most one decimal: 46.14 → "46.1%". */
export function formatPercent(pct: number): string {
  return `${trimZero(Math.round(pct * 10) / 10)}%`;
}

/**
 * "Nice" axis maximum and tick step for a value range starting at 0, using
 * 1/2/5 × 10^k steps. Returns ticks from 0 to max inclusive.
 */
export function niceTicks(maxValue: number, targetTicks = 4): number[] {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return [0, 1];
  const rough = maxValue / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  const step = (residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1) * magnitude;
  const top = Math.ceil(maxValue / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 1e9) / 1e9);
  return ticks;
}

/**
 * Human-readable column name for titles: "annual_revenue" → "Annual revenue",
 * "NPS score" → "NPS score". Only reformats snake/kebab-case names.
 */
export function humanizeColumn(name: string): string {
  const trimmed = name.trim();
  if (!/[_-]/.test(trimmed) || /\s/.test(trimmed)) return trimmed;
  const spaced = trimmed.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  const withAcronyms = spaced.replace(/\b(nps|id|csat|ces|url)\b/g, (m) => m.toUpperCase());
  return withAcronyms.charAt(0).toUpperCase() + withAcronyms.slice(1);
}

/**
 * Dollar amount with thousands separators: 125300 → "$125,300",
 * 49.5 → "$49.50", -2500 → "-$2,500". Whole dollars at $1,000 and above.
 */
export function formatCurrency(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const digits = abs >= 1000 || Number.isInteger(abs) ? 0 : 2;
  const body = abs.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${n < 0 ? "-" : ""}$${body}`;
}
