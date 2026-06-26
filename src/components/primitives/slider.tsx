import { Slider as BaseSlider } from "@base-ui/react/slider";
import type { ComponentProps } from "react";
import { cn } from "@src/lib/cn";

type SliderProps = ComponentProps<typeof BaseSlider.Root<number>>;

const root = "relative flex w-full touch-none select-none items-center h-6";

const control = "relative flex w-full items-center h-6";

const track = ["relative h-1.5 w-full overflow-hidden rounded-full", "bg-border"].join(" ");

const indicator = "absolute h-full rounded-full bg-accent";

const thumb = [
  "block h-4 w-4 rounded-full bg-bg",
  "border-2 border-accent",
  "transition-[transform,box-shadow] duration-150 ease-out",
  "cursor-grab",
  "hover:scale-110",
  // base-ui renders the visible thumb as a wrapper around a hidden
  // focusable input — the focus state lives on the child, so we match it
  // with `:has(:focus-visible)`. Stack two box-shadows for a clear cue:
  // a 2px bg-coloured "gap" pushing outward (so the halo doesn't merge
  // with the thumb's existing accent border), then a solid 3px accent
  // halo around that. Arbitrary values bypass Tailwind's `@theme inline`
  // substitution, so we reference `var(--accent)` / `var(--bg)` directly
  // instead of `var(--color-accent)` — that way the `[data-sin]` cascade
  // retints the halo automatically.
  "outline-none has-[:focus-visible]:shadow-[0_0_0_2px_var(--bg),0_0_0_5px_var(--accent)]",
  "data-[dragging]:cursor-grabbing data-[dragging]:scale-110",
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
].join(" ");

export function Slider({ className, "aria-label": ariaLabel, ...props }: SliderProps) {
  return (
    <BaseSlider.Root className={cn(root, className)} {...props}>
      <BaseSlider.Control className={control}>
        <BaseSlider.Track className={track}>
          <BaseSlider.Indicator className={indicator} />
        </BaseSlider.Track>
        <BaseSlider.Thumb
          className={thumb}
          getAriaLabel={ariaLabel ? () => ariaLabel : undefined}
        />
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
