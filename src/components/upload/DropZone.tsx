"use client";

import { useRef, useState } from "react";

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
}

function validateFile(file: File): string | null {
  const isCSV =
    ACCEPTED_TYPES.includes(file.type) ||
    file.name.toLowerCase().endsWith(ACCEPTED_EXT);
  if (!isCSV) return "Only CSV files are accepted.";
  if (file.size > MAX_BYTES) return "File exceeds the 10 MB limit.";
  return null;
}

export default function DropZone({ onFileSelect }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selected, setSelected] = useState<SelectedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
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
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
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

  const borderColor = error
    ? "border-red-400"
    : isDragging
      ? "border-blue-500"
      : selected
        ? "border-emerald-500"
        : "border-zinc-200";

  const bgColor = isDragging
    ? "bg-blue-50"
    : selected
      ? "bg-emerald-50"
      : "bg-white";

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="File upload drop zone. Click or drag a CSV file here."
        className={`relative rounded-lg border-2 border-dashed py-16 px-6 text-center cursor-pointer transition-colors ${borderColor} ${bgColor} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-900`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={handleChange}
          aria-hidden="true"
          tabIndex={-1}
        />

        {selected ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-emerald-700">
              {selected.name}
            </p>
            <p className="text-xs text-zinc-500">{selected.sizeKb} KB</p>
            <p className="text-xs text-emerald-600 mt-2">
              File ready — click Next to continue
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-700">
              {isDragging ? "Drop to upload" : "Drop your CSV here"}
            </p>
            <p className="text-xs text-zinc-400">
              or click to browse — CSV up to 10 MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {selected && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          className="text-xs text-zinc-400 hover:text-zinc-600 underline"
        >
          Remove file
        </button>
      )}
    </div>
  );
}
