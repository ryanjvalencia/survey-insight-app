import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export default function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 mb-4"
        >
          <span aria-hidden="true">←</span>
          {backLabel}
        </Link>
      )}
      <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      )}
    </div>
  );
}
