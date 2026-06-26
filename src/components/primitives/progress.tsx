import { Progress as BaseProgress } from "@base-ui/react/progress";
import type { ComponentProps } from "react";
import { cn } from "@src/lib/cn";

type Size = "sm" | "md" | "lg";

type ProgressProps = ComponentProps<typeof BaseProgress.Root> & {
  size?: Size;
  label?: string;
  showValue?: boolean;
  trackClassName?: string;
  indicatorClassName?: string;
};

const sizes: Record<Size, string> = {
  sm: "h-1",
  md: "h-1.5",
  lg: "h-2.5",
};

const track = "relative w-full overflow-hidden rounded-full bg-border";

const indicator = [
  "block h-full rounded-full bg-accent",
  "transition-[width] duration-300 ease-out",
  "data-[indeterminate]:w-1/3 data-[indeterminate]:animate-[progress-indeterminate_1.6s_ease-in-out_infinite]",
].join(" ");

export function Progress({
  className,
  size = "md",
  label,
  showValue,
  trackClassName,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const hasHeader = Boolean(label) || showValue;
  return (
    <BaseProgress.Root className={cn("flex w-full flex-col gap-2", className)} {...props}>
      {hasHeader && (
        <div className="flex items-baseline justify-between gap-3">
          {label && (
            <BaseProgress.Label className="text-style-caption text-fg-muted">
              {label}
            </BaseProgress.Label>
          )}
          {showValue && (
            <BaseProgress.Value className="text-style-caption text-fg-muted tabular-nums" />
          )}
        </div>
      )}
      <BaseProgress.Track className={cn(track, sizes[size], trackClassName)}>
        <BaseProgress.Indicator className={cn(indicator, indicatorClassName)} />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}
