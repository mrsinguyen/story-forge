import type { ComponentProps, ReactNode } from "react";
import { cn } from "@src/lib/cn";

type Variant = "solid" | "soft" | "outline";
type Size = "sm" | "md";

type BadgeProps = ComponentProps<"span"> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
};

const base = [
  "text-style-eyebrow",
  "inline-flex items-center gap-1.5",
  "rounded-full",
  "whitespace-nowrap",
].join(" ");

const variants: Record<Variant, string> = {
  solid: "bg-accent text-accent-fg",
  soft: "bg-accent-soft text-accent-strong",
  outline: "border border-border text-fg-muted",
};

const sizes: Record<Size, string> = {
  sm: "h-5 px-2 text-[0.7rem] [&>[data-badge-icon]]:h-3 [&>[data-badge-icon]]:w-3",
  md: "h-6 px-2.5 text-xs [&>[data-badge-icon]]:h-4 [&>[data-badge-icon]]:w-4",
};

export function Badge({
  className,
  variant = "soft",
  size = "md",
  icon,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {icon ? (
        <span
          data-badge-icon
          className="inline-flex shrink-0 items-center justify-center [&>svg]:h-full [&>svg]:w-full"
        >
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}
