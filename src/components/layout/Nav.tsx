"use client";

import { useEffect } from "react";
import Link from "next/link";
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
            {email && (
              <li className="hidden sm:block ml-2 max-w-48 truncate text-xs text-zinc-400" title={email}>
                {email}
              </li>
            )}
            <li>
              <form action={signOut}>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
