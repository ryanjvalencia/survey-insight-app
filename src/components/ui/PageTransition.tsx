import { ViewTransition } from "react";

/** Transition types attached to links/router pushes in the workflow. */
export const NAV_FORWARD = ["nav-forward"];
export const NAV_BACK = ["nav-back"];

/**
 * Animates page content on navigation: forward/back through the workflow
 * slides horizontally; any other navigation crossfades with a slight rise.
 * Must wrap content in each page.tsx (layouts persist, so they never animate).
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "page-fade" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "page-fade" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
