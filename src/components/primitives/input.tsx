import { Input as BaseInput } from "@base-ui/react/input";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@src/lib/cn";

type Size = "sm" | "md" | "lg";

type InputProps = Omit<ComponentProps<typeof BaseInput>, "size"> & {
  size?: Size;
  invalid?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const base = [
  "w-full font-serif",
  "bg-surface text-fg placeholder:text-fg-muted",
  "border border-border rounded-sm",
  "transition-colors duration-150",
  "focus:outline-none focus:border-accent",
  // See Button: outline-color pinned to accent in base so it doesn't
  // animate from currentColor to var(--accent) on focus.
  "outline-accent outline-offset-2",
  "focus-visible:outline-2",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
  "aria-invalid:border-sin-gluttony",
].join(" ");

const sizes: Record<Size, string> = {
  sm: "h-8 text-sm px-3",
  md: "h-10 text-base px-4",
  lg: "h-12 text-lg px-5",
};

const leftPad: Record<Size, string> = {
  sm: "pl-9",
  md: "pl-10",
  lg: "pl-12",
};

const rightPad: Record<Size, string> = {
  sm: "pr-9",
  md: "pr-10",
  lg: "pr-12",
};

const iconBase =
  "absolute top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none flex items-center";

const iconSide: Record<"left" | "right", Record<Size, string>> = {
  left: { sm: "left-2.5", md: "left-3", lg: "left-4" },
  right: { sm: "right-2.5", md: "right-3", lg: "right-4" },
};

export function Input({
  className,
  size = "md",
  invalid,
  leftIcon,
  rightIcon,
  ...props
}: InputProps) {
  const inputEl = (
    <BaseInput
      aria-invalid={invalid || undefined}
      className={cn(
        base,
        sizes[size],
        leftIcon && leftPad[size],
        rightIcon && rightPad[size],
        className,
      )}
      {...props}
    />
  );

  if (!leftIcon && !rightIcon) return inputEl;

  return (
    <div className="relative inline-block w-full">
      {leftIcon && <span className={cn(iconBase, iconSide.left[size])}>{leftIcon}</span>}
      {inputEl}
      {rightIcon && <span className={cn(iconBase, iconSide.right[size])}>{rightIcon}</span>}
    </div>
  );
}
