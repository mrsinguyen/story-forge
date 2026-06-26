import { GearIcon } from "@phosphor-icons/react";
import { cn } from "@src/lib/cn";

type Props = {
  size?: number;
  className?: string;
};

export function ClockworkSpinner({ size = 24, className }: Props) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-flex items-center justify-center text-accent", className)}
    >
      <GearIcon size={size} weight="light" className="animate-[spin_4s_linear_infinite]" />
    </span>
  );
}
