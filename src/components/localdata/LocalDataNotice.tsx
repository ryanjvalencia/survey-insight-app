import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { NAV_BACK } from "@/components/ui/PageTransition";
import { btnPrimary, card } from "@/components/ui/styles";

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

const ICONS = { loading: "file", error: "alert", missing: "upload" } as const;

/** Empty/loading/error state for steps that need the raw file. */
export default function LocalDataNotice({ kind, projectId }: LocalDataNoticeProps) {
  if (kind === "loading") {
    return (
      <div role="status" className={`${card} space-y-3 p-6`}>
        <span className="sr-only">{MESSAGES.loading}</span>
        {[70, 90, 55].map((w) => (
          <div
            key={w}
            className="h-3 animate-shimmer rounded-full bg-[linear-gradient(90deg,var(--color-surface-sunken),var(--color-line-soft),var(--color-surface-sunken))] bg-[length:200%_100%]"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`${card} animate-fade-up px-6 py-12 text-center`}
    >
      <div
        className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
          kind === "error" ? "bg-critical-bg text-critical-text" : "bg-brand-50 text-brand-700"
        }`}
      >
        <Icon name={ICONS[kind]} className="h-6 w-6" />
      </div>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-2">{MESSAGES[kind]}</p>
      <Link
        href={`/projects/${projectId}/upload`}
        transitionTypes={NAV_BACK}
        className={`${btnPrimary} mt-6`}
      >
        <Icon name="upload" className="h-4 w-4" />
        Upload file
      </Link>
    </div>
  );
}
