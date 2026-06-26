import { Button as BaseButton } from "@base-ui/react/button";
import { cloneElement, isValidElement, type ComponentProps, type ReactElement } from "react";
import { cn } from "@src/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

type IconButtonProps = Omit<ComponentProps<typeof BaseButton>, "aria-label"> & {
  variant?: Variant;
  size?: Size;
  "aria-label": string;
};

const base = [
  "inline-flex items-center justify-center",
  "transition-colors duration-150",
  "cursor-pointer select-none",
  // See Button: outline-color pinned to accent in base so it doesn't
  // animate from currentColor to var(--accent) on focus.
  "outline-accent outline-offset-2",
  "focus-visible:outline-2",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
].join(" ");

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active",
  secondary: "border border-accent text-accent hover:bg-accent-soft active:bg-accent-soft",
  outline: "border border-accent text-accent-strong hover:bg-accent-soft active:bg-accent-soft",
  ghost: "text-fg hover:bg-surface active:bg-surface",
};

const sizes: Record<Size, string> = {
  sm: "h-8 w-8 rounded-sm",
  md: "h-10 w-10 rounded-sm",
  lg: "h-12 w-12 rounded-sm",
};

const iconSizes: Record<Size, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function IconButton({
  className,
  variant = "primary",
  size = "md",
  children,
  render,
  nativeButton,
  ...props
}: IconButtonProps) {
  const icon = isValidElement(children)
    ? cloneElement(children as ReactElement<{ size?: number }>, { size: iconSizes[size] })
    : children;

  return (
    <BaseButton
      render={render}
      nativeButton={nativeButton ?? !render}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {icon}
    </BaseButton>
  );
}
