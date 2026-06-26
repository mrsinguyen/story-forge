import { createLink } from "@tanstack/react-router";
import { forwardRef } from "react";
import type { AnchorHTMLAttributes } from "react";
import { cn } from "@src/lib/cn";

/**
 * Routing-aware link with the design system's focus treatment baked in.
 *
 * Built via TanStack Router's `createLink` so the route-tree's type-safe `to`
 * / `params` / `search` / `activeOptions` checking is preserved end-to-end —
 * i.e. you get a TS error for an invalid path, not a runtime 404. Visuals
 * (color, hover, layout) stay with the caller via `className`.
 *
 * The focus-visible outline uses CSS `outline` (not `text-decoration` or
 * `box-shadow`) so it draws a single rectangle around the element box and
 * doesn't cascade through nested text content (important for card-wrapping
 * links). Color reads `--color-accent` at the using element so it cascades
 * cleanly under `[data-sin]`.
 *
 * For external destinations (plain `<a href=...>`), use `ExternalLink` —
 * it shares the same base styles but isn't bound to the route tree.
 */
const base = [
  "transition-colors duration-150 rounded-sm",
  // See Button: outline-color pinned to accent in base so it doesn't
  // animate from currentColor to var(--accent) on focus.
  "outline-accent outline-offset-2",
  "focus-visible:outline-2",
].join(" ");

const StyledAnchor = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
  function StyledAnchor({ className, ...props }, ref) {
    return <a {...props} ref={ref} className={cn(base, className)} />;
  },
);

export const Link = createLink(StyledAnchor);

/**
 * Plain anchor with the same base / focus styles as `<Link>`. Use for
 * external destinations or any non-routed `<a href=...>` so the focus
 * treatment is consistent across the app.
 */
export function ExternalLink({ className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} className={cn(base, className)} />;
}
