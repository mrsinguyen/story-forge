import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ComponentProps } from "react";
import { cn } from "@src/lib/cn";

const Root = BaseTooltip.Root;
const Trigger = BaseTooltip.Trigger;
const Portal = BaseTooltip.Portal;

function Provider({ delay = 300, ...props }: ComponentProps<typeof BaseTooltip.Provider>) {
  return <BaseTooltip.Provider delay={delay} {...props} />;
}

function Positioner({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof BaseTooltip.Positioner>) {
  return (
    <BaseTooltip.Positioner className={cn("z-50", className)} sideOffset={sideOffset} {...props} />
  );
}

function Popup({ className, ...props }: ComponentProps<typeof BaseTooltip.Popup>) {
  return (
    <BaseTooltip.Popup
      className={cn(
        "max-w-xs",
        // accent-fg is the theme-aware dark token used as readable text on a
        // filled accent surface — ink purple in light theme, warm dark brown
        // in dark theme. Pairs with bone for high contrast in both.
        "bg-accent-fg text-bone",
        "text-style-caption",
        "px-2.5 py-1.5",
        "rounded-sm",
        "border border-fg-muted/20",
        "shadow-md shadow-ink/30",
        "transition-[opacity,transform,scale] duration-150 ease-out",
        "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
        "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
        "data-[instant]:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function Arrow({ className, ...props }: ComponentProps<typeof BaseTooltip.Arrow>) {
  return (
    <BaseTooltip.Arrow
      className={cn(
        "data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180",
        "data-[side=bottom]:top-[-6px]",
        "data-[side=left]:right-[-9px] data-[side=left]:rotate-90",
        "data-[side=right]:left-[-9px] data-[side=right]:-rotate-90",
        className,
      )}
      {...props}
    >
      <svg width="12" height="6" viewBox="0 0 12 6" fill="none" aria-hidden>
        <path d="M0 6 L6 0 L12 6 Z" className="fill-accent-fg" />
        <path d="M0 6 L6 0 L12 6" className="stroke-fg-muted/20" strokeWidth="1" fill="none" />
      </svg>
    </BaseTooltip.Arrow>
  );
}

export const Tooltip = Object.assign(Root, {
  Provider,
  Trigger,
  Portal,
  Positioner,
  Popup,
  Arrow,
});
