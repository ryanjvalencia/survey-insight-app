"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DropZone, { type SelectedFile } from "@/components/upload/DropZone";
import Icon from "@/components/ui/Icon";
import { NAV_FORWARD } from "@/components/ui/PageTransition";
import { btnPrimary } from "@/components/ui/styles";
import { parseCSV } from "@/lib/parse";
import { validateParsedDataset } from "@/lib/validate";
import { saveUpload } from "@/lib/localdata";
import { getBrowserStore } from "@/lib/localdata/indexeddb";
import type { ParseResult } from "@/types";
import { recordUpload } from "../actions";

interface UploadSectionProps {
  projectId: string;
}

const STAGES = [
  "Reading your file",
  "Checking rows and columns",
  "Saving securely on this device",
  "Recording upload details",
] as const;

type Progress =
  | { phase: "idle" }
  | { phase: "working"; stage: number }
  | { phase: "done"; rows: number; columns: number };

/** Lets the browser paint before the next (synchronous) step runs. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

/** Brief hold on the success state so the completed checklist registers. */
const SUCCESS_HOLD_MS = 650;

export default function UploadSection({ projectId }: UploadSectionProps) {
  const router = useRouter();
  const [file, setFile] = useState<SelectedFile | null>(null);
  const [progress, setProgress] = useState<Progress>({ phase: "idle" });
  const [error, setError] = useState<string | null>(null);

  function fail(message: string) {
    setError(message);
    setProgress({ phase: "idle" });
  }

  async function handleNext() {
    if (!file) return;
    setError(null);

    setProgress({ phase: "working", stage: 0 });
    await nextFrame();
    let result: ParseResult;
    try {
      const text = await file.file.text();
      result = parseCSV(text, file.name);
    } catch {
      return fail("Failed to read the file. Please try again.");
    }

    setProgress({ phase: "working", stage: 1 });
    await nextFrame();
    const validation = validateParsedDataset(result.dataset);
    const blocking = validation.issues.find((i) => i.severity === "error");
    if (blocking) return fail(blocking.message);

    setProgress({ phase: "working", stage: 2 });
    await nextFrame();
    try {
      // Raw rows stay on this device (IndexedDB); only counts go to the server.
      await saveUpload(getBrowserStore(), projectId, result);
    } catch {
      return fail(
        "Couldn't store the file in this browser. Private browsing, low disk space, or strict privacy settings can block this.",
      );
    }

    setProgress({ phase: "working", stage: 3 });
    // Persist metadata only — raw rows never leave the browser
    const saved = await recordUpload({
      projectId,
      originalFilename: result.originalFilename,
      rowCount: result.dataset.rowCount,
      columnCount: result.dataset.headers.length,
    }).catch(() => null);
    if (!saved?.ok) {
      return fail(
        saved?.error ?? "Couldn't reach the server. Check your connection and try again.",
      );
    }

    setProgress({
      phase: "done",
      rows: result.dataset.rowCount,
      columns: result.dataset.headers.length,
    });
    await new Promise((resolve) => setTimeout(resolve, SUCCESS_HOLD_MS));
    router.push(`/projects/${projectId}/preview`, { transitionTypes: NAV_FORWARD });
  }

  const busy = progress.phase !== "idle";

  return (
    <div className="space-y-6">
      <DropZone
        disabled={busy}
        onFileSelect={(f) => {
          setFile(f);
          setError(null);
        }}
      />

      {busy && <ProgressChecklist progress={progress} />}

      {error && (
        <div
          role="alert"
          className="flex animate-fade-up items-start gap-3 rounded-xl bg-critical-bg px-4 py-3 text-sm text-critical-text ring-1 ring-critical/20"
        >
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-ink-3">
          Your raw responses never leave this browser. Only row and column counts are saved to your account.
        </p>
        <button
          type="button"
          onClick={handleNext}
          disabled={!file || busy}
          className={`${btnPrimary} shrink-0`}
        >
          {busy ? "Processing…" : "Upload and preview"}
          {!busy && <Icon name="arrowRight" className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function ProgressChecklist({ progress }: { progress: Exclude<Progress, { phase: "idle" }> }) {
  const current = progress.phase === "done" ? STAGES.length : progress.stage;
  const pct = progress.phase === "done" ? 100 : ((progress.stage + 0.5) / STAGES.length) * 100;

  return (
    <div
      className="animate-fade-up rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line-soft"
      role="status"
      aria-live="polite"
    >
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
        <div
          className={[
            "h-full rounded-full transition-[width] duration-500 ease-out",
            progress.phase === "done" ? "bg-good" : "bg-brand-500",
          ].join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>

      {progress.phase === "done" ? (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 animate-pop items-center justify-center rounded-full bg-good text-white">
            <Icon name="check" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Upload complete</p>
            <p className="text-xs text-ink-2">
              {progress.rows.toLocaleString("en-US")} rows · {progress.columns} columns — opening preview…
            </p>
          </div>
        </div>
      ) : (
        <ol className="space-y-2.5">
          {STAGES.map((label, i) => {
            const state = i < current ? "done" : i === current ? "active" : "todo";
            return (
              <li key={label} className="flex items-center gap-3 text-sm">
                <span
                  className={[
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                    state === "done"
                      ? "bg-brand-600 text-white"
                      : state === "active"
                        ? "border-2 border-brand-500 border-t-transparent animate-spin"
                        : "border border-line",
                  ].join(" ")}
                >
                  {state === "done" && <Icon name="check" className="h-3 w-3 animate-pop" />}
                </span>
                <span
                  className={
                    state === "todo"
                      ? "text-ink-3"
                      : state === "active"
                        ? "font-medium text-ink"
                        : "text-ink-2"
                  }
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
