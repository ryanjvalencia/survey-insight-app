"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DropZone, { type SelectedFile } from "@/components/upload/DropZone";
import { parseCSV } from "@/lib/parse";
import { saveDataset } from "@/lib/db/datasets";
import { updateProjectStatus } from "@/lib/db/projects";

interface UploadSectionProps {
  projectId: string;
}

export default function UploadSection({ projectId }: UploadSectionProps) {
  const router = useRouter();
  const [file, setFile] = useState<SelectedFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNext() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const text = await file.file.text();
      const result = parseCSV(text, file.name);
      sessionStorage.setItem(`preview:${projectId}`, JSON.stringify(result));

      // Persist metadata only — raw rows stay in sessionStorage, never sent to DB
      await saveDataset({
        projectId,
        originalFilename: result.originalFilename,
        rowCount: result.dataset.rowCount,
        columnCount: result.dataset.headers.length,
      });
      await updateProjectStatus(projectId, "uploaded");

      router.push(`/projects/${projectId}/preview`);
    } catch {
      setError("Failed to read the file. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <DropZone
        onFileSelect={(f) => {
          setFile(f);
          setError(null);
        }}
      />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        {file ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing…" : "Next: Preview →"}
          </button>
        ) : (
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-400 cursor-not-allowed"
          >
            Next: Preview →
          </button>
        )}
      </div>
    </div>
  );
}
