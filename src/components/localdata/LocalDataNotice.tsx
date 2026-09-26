import Link from "next/link";

interface LocalDataNoticeProps {
  kind: "loading" | "error" | "missing";
  projectId: string;
}

const MESSAGES = {
  loading: "Loading your file…",
  error:
    "This browser blocked local storage, so the uploaded file can't be opened. Private browsing or strict privacy settings can cause this.",
  missing:
    "No file loaded on this device. Files stay in your browser for 7 days (or until you sign out) and are never uploaded to our servers.",
} as const;

/** Empty/loading/error state for steps that need the raw file. */
export default function LocalDataNotice({ kind, projectId }: LocalDataNoticeProps) {
  return (
    <div className="space-y-6">
      <div
        role={kind === "error" ? "alert" : "status"}
        className="rounded-lg border border-zinc-100 bg-zinc-50 px-6 py-12 text-center"
      >
        <p className="text-sm text-zinc-500 max-w-md mx-auto">{MESSAGES[kind]}</p>
      </div>
      {kind !== "loading" && (
        <Link
          href={`/projects/${projectId}/upload`}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Upload file
        </Link>
      )}
    </div>
  );
}
