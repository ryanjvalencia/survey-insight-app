"use client";

import type { ParseResult } from "@/types";
import Icon from "@/components/ui/Icon";
import { card } from "@/components/ui/styles";
import { formatCount } from "@/lib/format";
import LocalDataNotice from "@/components/localdata/LocalDataNotice";
import { useLocalProjectData } from "@/components/localdata/useLocalProjectData";

const MAX_PREVIEW_ROWS = 25;

interface PreviewTableProps {
  projectId: string;
}

export default function PreviewTable({ projectId }: PreviewTableProps) {
  const local = useLocalProjectData(projectId);

  if (local.status !== "ready") {
    return <LocalDataNotice kind={local.status} projectId={projectId} />;
  }
  const result: ParseResult | null = local.upload;
  if (result === null || result.dataset.headers.length === 0) {
    return <LocalDataNotice kind="missing" projectId={projectId} />;
  }

  const { dataset } = result;
  const previewRows = dataset.rows.slice(0, MAX_PREVIEW_ROWS);

  return (
    <div className="space-y-4 animate-fade-up">
      {dataset.parseWarnings.length > 0 && (
        <div role="status" className="flex gap-3 rounded-xl bg-warning-bg px-4 py-3 ring-1 ring-warning/30">
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-warning-text" />
          <div>
            <p className="text-sm font-semibold text-warning-text">We fixed a few formatting issues</p>
            <ul className="mt-1 space-y-0.5">
              {dataset.parseWarnings.map((w, i) => (
                <li key={i} className="text-xs text-warning-text">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-800">
          {formatCount(dataset.rowCount)} rows
        </span>
        <span className="rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-800">
          {dataset.headers.length} columns
        </span>
        {dataset.rowCount > MAX_PREVIEW_ROWS && (
          <span className="text-ink-3">Showing the first {MAX_PREVIEW_ROWS} rows</span>
        )}
      </div>

      <div className={`${card} max-h-[60vh] overflow-auto`}>
        <table className="w-full min-w-max text-sm">
          <thead className="sticky top-0 z-10 bg-surface-muted/95 backdrop-blur">
            <tr>
              <th scope="col" className="w-10 px-3 py-2.5 text-right text-xs font-medium text-ink-3">
                #
              </th>
              {dataset.headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold text-ink"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {previewRows.map((row, i) => (
              <tr key={i} className="transition-colors hover:bg-brand-50/60">
                <td className="tabular px-3 py-2 text-right text-xs text-ink-3">{i + 1}</td>
                {dataset.headers.map((header) => (
                  <td key={header} className="max-w-xs truncate px-3 py-2 text-[13px] text-ink-2">
                    {row[header] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
