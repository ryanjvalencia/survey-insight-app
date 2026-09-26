import { formatCount } from "@/lib/format";

interface BarListProps {
  items: Array<{ label: string; value: number }>;
  unit: string;
  ariaLabel: string;
}

/** Ranked horizontal bars — clearer than a word cloud for comparing counts. */
export default function BarList({ items, unit, ariaLabel }: BarListProps) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ol aria-label={ariaLabel} className="space-y-2">
      {items.map((item, i) => (
        <li key={item.label} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3">
          <span className="truncate text-sm text-ink" title={item.label}>
            {item.label}
          </span>
          <div className="h-3 overflow-hidden rounded-r-[4px]">
            <div
              className="h-full animate-grow-x origin-left rounded-r-[4px]"
              style={{
                width: `${(item.value / max) * 100}%`,
                background: "var(--color-series-1)",
                animationDelay: `${i * 40}ms`,
              }}
            />
          </div>
          <span className="tabular w-12 text-right text-xs text-ink-2" aria-label={`${formatCount(item.value)} ${unit}`}>
            {formatCount(item.value)}
          </span>
        </li>
      ))}
    </ol>
  );
}
