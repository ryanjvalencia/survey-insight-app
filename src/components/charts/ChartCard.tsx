import Icon from "@/components/ui/Icon";
import { card } from "@/components/ui/styles";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Rows for the accessible table view: [header, ...rows]. */
  table?: { columns: string[]; rows: Array<Array<string>> };
  className?: string;
}

/** Card wrapper for one chart, with an optional "Show data table" view. */
export default function ChartCard({ title, subtitle, children, table, className = "" }: ChartCardProps) {
  return (
    <section className={`${card} flex flex-col p-5 sm:p-6 animate-fade-up ${className}`}>
      <header className="mb-5">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-2">{subtitle}</p>}
      </header>
      <div className="flex-1">{children}</div>
      {table && table.rows.length > 0 && (
        <details className="group mt-5 border-t border-line-soft pt-3 print:hidden">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded text-xs font-medium text-ink-2 hover:text-brand-700 [&::-webkit-details-marker]:hidden">
            <Icon name="table" className="h-3.5 w-3.5" />
            <span className="group-open:hidden">Show data table</span>
            <span className="hidden group-open:inline">Hide data table</span>
          </summary>
          <div className="mt-3 max-h-64 overflow-auto rounded-lg ring-1 ring-line-soft">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-muted">
                <tr>
                  {table.columns.map((c, i) => (
                    <th
                      key={c}
                      scope="col"
                      className={`px-3 py-2 font-medium text-ink-2 ${i === 0 ? "text-left" : "text-right"}`}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {table.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, i) => (
                      <td
                        key={i}
                        className={`px-3 py-1.5 ${i === 0 ? "text-left text-ink" : "tabular text-right text-ink-2"}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
