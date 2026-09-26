"use client";

import { useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import Icon from "@/components/ui/Icon";
import { btnGhost } from "@/components/ui/styles";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { clearAllLocalData, purgeExpired } from "@/lib/localdata";
import { getBrowserStore } from "@/lib/localdata/indexeddb";

/** Clears raw survey data from this device before ending the session. */
async function signOut() {
  await clearAllLocalData(getBrowserStore()).catch(() => null);
  await logout();
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Projects" },
];

export default function Nav({ email }: { email: string | null }) {
  const pathname = usePathname();

  // Drop uploaded files older than the local retention window.
  useEffect(() => {
    purgeExpired(getBrowserStore()).catch(() => null);
  }, []);

  return (
    <header
      className="sticky top-0 z-20 border-b border-line-soft bg-surface/80 backdrop-blur-md print:hidden"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Logo href="/dashboard" />

        <nav aria-label="Main">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + "/") ||
                (href === "/dashboard" && pathname.startsWith("/projects"));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "px-3 py-1.5 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-brand-50 text-brand-800 font-medium"
                        : "text-ink-2 hover:text-ink hover:bg-surface-sunken",
                    ].join(" ")}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
            {email && (
              <li
                className="hidden md:flex items-center gap-2 ml-3 pl-3 border-l border-line-soft text-xs text-ink-3"
                title={email}
              >
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold uppercase text-brand-800"
                >
                  {email.slice(0, 1)}
                </span>
                <span className="max-w-44 truncate">{email}</span>
              </li>
            )}
            <li>
              <form action={signOut}>
                <button type="submit" className={btnGhost} title="Sign out">
                  <Icon name="logout" className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </form>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
