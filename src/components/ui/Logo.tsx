import Link from "next/link";

/** Brand mark: three rising bars in a rounded tile, plus the wordmark. */
export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-800 shadow-sm transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-105">
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
          <rect x="3" y="11" width="3" height="6" rx="1" fill="#ffffff" fillOpacity="0.7" />
          <rect x="8.5" y="7" width="3" height="10" rx="1" fill="#ffffff" fillOpacity="0.85" />
          <rect x="14" y="3" width="3" height="14" rx="1" fill="#ffffff" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-ink">Survey Insight</span>
    </Link>
  );
}
