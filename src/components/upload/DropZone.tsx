"use client";

import { useRef, useState } from "react";
import Icon from "@/components/ui/Icon";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ["text/csv", "application/vnd.ms-excel"];
const ACCEPTED_EXT = ".csv";

export interface SelectedFile {
  file: File;
  name: string;
  sizeKb: number;
}

interface DropZoneProps {
  onFileSelect: (selected: SelectedFile | null) => void;
  disabled?: boolean;
}

function validateFile(file: File): string | null {
  const isCSV =
    ACCEPTED_TYPES.includes(file.type) ||
    file.name.toLowerCase().endsWith(ACCEPTED_EXT);
  if (!isCSV) return "Only CSV files are accepted. Export your sheet as .csv and try again.";
  if (file.size > MAX_BYTES) return "This file is larger than 10 MB. Remove unused columns or split it into smaller files.";
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DropZone({ onFileSelect, disabled = false }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selected, setSelected] = useState<SelectedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openPicker() {
    if (!disabled) inputRef.current?.click();
  }

  function handleFiles(files: FileList | null) {
    if (disabled || !files || files.length === 0) return;
    const file = files[0];
    const err = validateFile(file);
    if (err) {
      setError(err);
      setSelected(null);
      onFileSelect(null);
      return;
    }
    const selectedFile: SelectedFile = {
      file,
      name: file.name,
      sizeKb: Math.round(file.size / 1024),
    };
    setError(null);
    setSelected(selectedFile);
    onFileSelect(selectedFile);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    // Ignore leave events fired when moving between child elements.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    // Reset input so the same file can be re-selected after removal
    e.target.value = "";
  }

  function handleRemove() {
    setSelected(null);
    setError(null);
    onFileSelect(null);
  }

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept=".csv,text/csv"
      className="sr-only"
      onChange={handleChange}
      aria-hidden="true"
      tabIndex={-1}
    />
  );

  if (selected) {
    return (
      <div className="animate-pop rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line-soft">
        {input}
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Icon name="file" className="h-6 w-6" />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 animate-pop items-center justify-center rounded-full bg-good text-white ring-2 ring-surface [animation-delay:150ms]">
              <Icon name="check" className="h-3 w-3" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink" title={selected.name}>
              {selected.name}
            </p>
            <p className="mt-0.5 text-xs text-ink-3">
              {formatFileSize(selected.file.size)} · ready to process
            </p>
          </div>
          {!disabled && (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={openPicker}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a CSV file. Press Enter to browse, or drag a file here."
        aria-disabled={disabled}
        className={[
          "group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all duration-200 ease-out",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100",
          isDragging
            ? "scale-[1.015] border-brand-500 bg-brand-50 shadow-raised ring-4 ring-brand-100"
            : error
              ? "border-critical/50 bg-critical-bg"
              : "border-brand-200 bg-surface hover:border-brand-300 hover:bg-brand-50/50 hover:shadow-card",
        ].join(" ")}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {input}

        {/* Soft brand glow that brightens on drag */}
        <div
          aria-hidden="true"
          className={[
            "pointer-events-none absolute left-1/2 top-6 h-32 w-32 -translate-x-1/2 rounded-full bg-brand-200 blur-3xl transition-opacity duration-300",
            isDragging ? "opacity-70" : "opacity-0 group-hover:opacity-40",
          ].join(" ")}
        />

        <div className="relative">
          <div
            className={[
              "mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md transition-all duration-300",
              isDragging
                ? "scale-110 bg-brand-600"
                : "animate-float bg-gradient-to-br from-brand-500 to-brand-700 group-hover:scale-105",
            ].join(" ")}
          >
            <Icon name="upload" className="h-7 w-7" />
          </div>
          <p className="text-base font-semibold text-ink">
            {isDragging ? "Release to upload" : "Drag and drop your CSV"}
          </p>
          <p className="mt-1 text-sm text-ink-2">
            or <span className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-4 group-hover:decoration-brand-600">browse your files</span>
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-ink-2">
            <span className="rounded-full bg-surface-sunken px-2.5 py-1">CSV</span>
            <span className="rounded-full bg-surface-sunken px-2.5 py-1">Up to 10 MB</span>
            <span className="rounded-full bg-surface-sunken px-2.5 py-1">50,000 rows</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-good-bg px-2.5 py-1 text-good-text">
              <Icon name="shield" className="h-3.5 w-3.5" />
              Stays on your device
            </span>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="flex animate-fade-up items-start gap-2 text-sm text-critical-text">
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
