"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/dashboard", label: "Projects" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-100 bg-white">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors"
        >
          Survey Insight
        </Link>

        <nav>
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + "/") ||
                (href === "/dashboard" && pathname.startsWith("/projects"));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={[
                      "px-3 py-1.5 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-zinc-100 text-zinc-900 font-medium"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50",
                    ].join(" ")}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
