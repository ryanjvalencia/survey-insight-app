import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center">
          <Link
            href="/"
            className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors"
          >
            Survey Insight
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-6 py-16">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
