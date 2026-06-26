import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export { useTheme } from "next-themes";

/*
 * Wraps `next-themes` ThemeProvider with our preferred config:
 * - attribute="data-theme" matches our CSS in `index.css` ([data-theme="dark"]).
 * - defaultTheme="system" + enableSystem honors `prefers-color-scheme` until
 *   the user picks one explicitly.
 * - disableTransitionOnChange suppresses CSS transitions during the swap so
 *   color tokens flip cleanly without animating mid-transition.
 *
 * `next-themes` injects an inline <script> at the top of <head> that applies
 * the saved/system theme before React mounts — no flash of wrong theme.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
