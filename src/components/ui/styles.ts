// Shared class recipes so every screen uses the same buttons and surfaces.

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";

/** Brand-filled button — the one primary action on a screen. */
export const btnPrimary = `${buttonBase} bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-md`;

/** Outlined button for secondary actions (Back, Cancel). */
export const btnSecondary = `${buttonBase} border border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-muted`;

/** Low-emphasis text button. */
export const btnGhost = `${buttonBase} text-ink-2 hover:bg-surface-sunken hover:text-ink`;

/** Rounded surface with a soft shadow instead of a heavy border. */
export const card = "rounded-2xl bg-surface shadow-card ring-1 ring-line-soft";

/** Card with standard padding. */
export const cardPadded = `${card} p-5 sm:p-6`;

/** Small uppercase label above a section. */
export const eyebrow = "text-xs font-semibold uppercase tracking-wider text-brand-700";

/** Section heading inside a page. */
export const sectionTitle = "text-base font-semibold text-ink";

/** Form text input. */
export const input =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-3 transition-shadow focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";
