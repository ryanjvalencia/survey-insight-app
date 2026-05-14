"use client";

import Link from "next/link";
import { useState } from "react";
import DropZone, { type SelectedFile } from "@/components/upload/DropZone";

interface UploadSectionProps {
  projectId: string;
}

export default function UploadSection({ projectId }: UploadSectionProps) {
  const [file, setFile] = useState<SelectedFile | null>(null);

  return (
    <div className="space-y-6">
      <DropZone onFileSelect={setFile} />

      <div className="flex justify-end">
        {file ? (
          <Link
            href={`/projects/${projectId}/preview`}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            Next: Preview →
          </Link>
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
