import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { NAV_BACK } from "@/components/ui/PageTransition";
import { eyebrow as eyebrowClass } from "@/components/ui/styles";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  eyebrow,
  backHref,
  backLabel = "Back",
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {backHref && (
          <Link
            href={backHref}
            transitionTypes={NAV_BACK}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-brand-700"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
            {backLabel}
          </Link>
        )}
        {eyebrow && <p className={`${eyebrowClass} mb-2`}>{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-2">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}
