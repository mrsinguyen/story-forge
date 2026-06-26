import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "@src/lib/theme";
import { IconButton } from "@src/components/primitives/icon-button";

type Resolved = "light" | "dark";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Avoid icon flicker on first paint — `resolvedTheme` resolves after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Drives the icon during the wipe so it flips the instant the user clicks,
  // even though `setTheme` is deferred until the view-transition completes.
  const [override, setOverride] = useState<Resolved | null>(null);
  useEffect(() => {
    if (override && resolvedTheme === override) setOverride(null);
  }, [override, resolvedTheme]);

  const current = (override ?? resolvedTheme) as Resolved | undefined;
  const isDark = current === "dark";

  const toggle = () => {
    const next: Resolved = isDark ? "light" : "dark";

    if (!document.startViewTransition) {
      setTheme(next);
      return;
    }

    setOverride(next);
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        document.documentElement.setAttribute("data-theme", next);
      });
    });

    // Fire-and-forget: the wipe animation runs in the background, and the
    // commit-to-next-theme `setTheme` is queued behind its `finished` promise.
    // We don't await either — `void` makes the lint rule's intent explicit.
    void transition.ready.then(() => {
      void document.documentElement
        .animate(
          { clipPath: ["inset(0 100% 0 0)", "inset(0 0 0 0)"] },
          {
            duration: 700,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          },
        )
        .finished.finally(() => {
          setTheme(next);
        });
    });
  };

  return (
    <>
      <IconButton
        variant="ghost"
        size="sm"
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        onClick={toggle}
      >
        {mounted ? (
          isDark ? (
            <SunIcon weight="light" />
          ) : (
            <MoonIcon weight="light" />
          )
        ) : (
          // Placeholder reserves space until theme resolves.
          <span className="block h-5 w-5" aria-hidden />
        )}
      </IconButton>
      {/* Suppress the browser's default cross-fade so only the clip-path wipe shows. */}
      <style>{`::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}`}</style>
    </>
  );
}
