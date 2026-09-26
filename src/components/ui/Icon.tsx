// Minimal inline icon set (24px grid, 1.75px stroke). Decorative by default;
// pass a `title` when the icon carries meaning on its own.

const PATHS = {
  upload: "M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5M9 13h6M9 17h4",
  check: "M5 12.5 10 17l9-10",
  checkCircle: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM8 12.5l2.5 2.5L16 9.5",
  alert: "M12 9v4m0 4h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  info: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 16v-4m0-4h.01",
  arrowRight: "M5 12h14m-6-6 6 6-6 6",
  arrowLeft: "M19 12H5m6 6-6-6 6-6",
  trendUp: "M3 17 9 11l4 4 8-8m0 0h-6m6 0v6",
  trendDown: "M3 7l6 6 4-4 8 8m0 0h-6m6 0v-6",
  minus: "M5 12h14",
  chart: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
  plus: "M12 5v14M5 12h14",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z",
  shield: "M12 3 5 6v6c0 4.4 3 7.9 7 9 4-1.1 7-4.6 7-9V6l-7-3Z",
  table: "M3 5h18v14H3V5Zm0 5h18M3 15h18M9 5v14",
  download: "M12 4v12m0 0-4-4m4 4 4-4M4 18v2h16v-2",
  printer: "M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2m-10-3h10v7H7v-7Z",
  logout: "M15 17l5-5-5-5m5 5H9m4 9H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7",
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  className?: string;
  title?: string;
}

export default function Icon({ name, className = "h-5 w-5", title }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      <path d={PATHS[name]} />
    </svg>
  );
}
