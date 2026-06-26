import type { ErrorComponentProps } from "@tanstack/react-router";
import { Button } from "@src/components/primitives/button";
import { Link } from "@src/components/primitives/link";
import { Ornament } from "@src/components/thematic/ornament";

/**
 * Sin-themed last-resort error fallback. Wired onto the root route's
 * `errorComponent` so any uncaught throw — including failed chapter fetches
 * and other route-loader rejections — surfaces in the chronicle's voice
 * instead of React's default boundary or a blank screen.
 *
 * Uses semantic tokens only; safe to render even when context providers
 * (Tooltip / Toast / Audio) haven't mounted, since `next-themes` injects an
 * inline script that sets `data-theme` before React boots.
 */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="bg-bg min-h-screen text-fg flex flex-col items-center justify-center px-6 py-20">
      <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <span className="text-style-eyebrow text-fg-muted">An error has stirred the cycle</span>
        <h1 className="text-style-display text-fg">Something split the timeline</h1>
        <Ornament glyph="❦" className="w-full max-w-md" />
        <p className="text-style-lead text-fg-muted">
          Whatever you reached for has torn loose from the chronicle. Retrace your steps, or return
          to the beginning of the cycle.
        </p>
        {isDev ? (
          <pre className="text-style-caption text-fg-muted bg-surface border-border w-full max-w-full overflow-auto rounded-sm border p-3 text-left">
            {error?.message ?? String(error)}
          </pre>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button variant="secondary" onClick={reset}>
            Try again
          </Button>
          <Button variant="primary" render={<Link to="/" />}>
            Back to the reader
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Companion 404 fallback. Rendered when a route's loader throws `notFound()`
 * or no route matches the current URL.
 */
export function RouteNotFound() {
  return (
    <div className="bg-bg min-h-screen text-fg flex flex-col items-center justify-center px-6 py-20">
      <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <span className="text-style-eyebrow text-fg-muted">Not in the cycle</span>
        <h1 className="text-style-display text-fg">This page isn't written</h1>
        <Ornament glyph="❦" className="w-full max-w-md" />
        <p className="text-style-lead text-fg-muted">
          The chronicle has no entry for what you sought. The link may be from a draft, an older
          revision, or somewhere the story hasn't reached yet.
        </p>
        <div className="mt-2">
          <Button variant="primary" render={<Link to="/" />}>
            Back to the reader
          </Button>
        </div>
      </div>
    </div>
  );
}
