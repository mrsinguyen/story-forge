import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { ComponentProps } from "react";
import { cn } from "@src/lib/cn";

type SwitchProps = ComponentProps<typeof BaseSwitch.Root>;

const root = [
  "relative inline-flex h-[22px] w-[40px] shrink-0 items-center rounded-full",
  "border border-border bg-surface",
  "transition-colors duration-150",
  "cursor-pointer",
  // See Button: outline-color pinned to accent in base so it doesn't
  // animate from currentColor to var(--accent) on focus.
  "outline-accent outline-offset-2",
  "focus-visible:outline-2",
  "data-[checked]:border-accent data-[checked]:bg-accent",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
].join(" ");

const thumb = [
  "block h-[16px] w-[16px] rounded-full bg-bg shadow-sm",
  "transition-transform duration-150 ease-out",
  "translate-x-[3px] data-[checked]:translate-x-[21px]",
].join(" ");

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <BaseSwitch.Root className={cn(root, className)} {...props}>
      <BaseSwitch.Thumb className={thumb} />
    </BaseSwitch.Root>
  );
}
