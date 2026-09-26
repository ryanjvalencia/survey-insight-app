import Logo from "@/components/ui/Logo";
import Icon, { type IconName } from "@/components/ui/Icon";

const POINTS: Array<{ icon: IconName; text: string }> = [
  { icon: "sparkle", text: "Messy exports cleaned automatically" },
  { icon: "chart", text: "NPS, ratings, and themes charted for you" },
  { icon: "printer", text: "A client-ready report in minutes" },
  { icon: "shield", text: "Raw responses never leave your browser" },
];

const BARS = [38, 62, 48, 80, 66, 92];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid flex-1 lg:grid-cols-[1fr_1.1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-12 text-white lg:flex lg:flex-col">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-series-3/20 blur-3xl"
        />
        <div className="relative [&_span]:text-white">
          <Logo />
        </div>

        <div className="relative my-auto max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            From survey export to client insight, without the spreadsheet wrangling.
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p, i) => (
              <li
                key={p.text}
                className="flex animate-fade-up items-center gap-3 text-[15px] text-white/90"
                style={{ animationDelay: `${150 + i * 90}ms` }}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon name={p.icon} className="h-4 w-4" />
                </span>
                {p.text}
              </li>
            ))}
          </ul>

          <div
            aria-hidden="true"
            className="mt-12 flex h-28 items-end gap-2 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
          >
            {BARS.map((h, i) => (
              <div
                key={i}
                className="flex-1 animate-grow-y origin-bottom rounded-t-[4px] bg-white/70"
                style={{ height: `${h}%`, animationDelay: `${400 + i * 70}ms` }}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Form */}
      <main className="flex flex-col px-4 py-8 sm:px-6">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm animate-fade-up">{children}</div>
        </div>
      </main>
    </div>
  );
}
