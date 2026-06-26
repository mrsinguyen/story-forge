import { cn } from "@src/lib/cn";

type Props = {
  glyph?: string;
  className?: string;
};

/**
 * A decorative section break — two thin rules with a centered glyph in
 * Pirata One (the accent font). Use between volume sections for storybook
 * pacing, or as a chapter-end flourish.
 */
export function Ornament({ glyph = "✦", className }: Props) {
  return (
    <div
      role="separator"
      aria-hidden
      className={cn("flex items-center gap-4 my-8 text-fg-muted", className)}
    >
      <span className="flex-1 h-px bg-border" />
      <span className="font-accent text-xl leading-none text-accent">{glyph}</span>
      <span className="flex-1 h-px bg-border" />
    </div>
  );
}
