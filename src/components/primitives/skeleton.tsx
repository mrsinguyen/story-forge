import type { ComponentProps } from "react";
import { cn } from "@src/lib/cn";

type Variant = "rect" | "text" | "circle";

type SkeletonProps = Omit<ComponentProps<"div">, "children"> & {
  variant?: Variant;
  lines?: number;
};

const base = [
  "bg-border",
  "bg-gradient-to-r from-border via-surface to-border",
  "bg-[length:200%_100%]",
  "animate-[skeleton-shimmer_1.6s_ease-in-out_infinite]",
].join(" ");

const variants: Record<Variant, string> = {
  rect: "w-full h-4 rounded-sm",
  text: "w-full h-4 rounded-sm",
  circle: "rounded-full aspect-square",
};

export function Skeleton({
  className,
  variant = "rect",
  lines = 1,
  role = "status",
  "aria-busy": ariaBusy = true,
  "aria-live": ariaLive = "polite",
  ...props
}: SkeletonProps) {
  if (variant === "text" && lines > 1) {
    return (
      <div
        role={role}
        aria-busy={ariaBusy}
        aria-live={ariaLive}
        className={cn("flex flex-col gap-2", className)}
        {...props}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={cn(base, variants.text, i === lines - 1 && "w-3/4")} />
        ))}
      </div>
    );
  }

  return (
    <div
      role={role}
      aria-busy={ariaBusy}
      aria-live={ariaLive}
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
}
