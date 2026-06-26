import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ComponentProps } from "react";
import { cn } from "@src/lib/cn";

const Root = BaseTabs.Root;

function List({ className, ...props }: ComponentProps<typeof BaseTabs.List>) {
  return (
    <BaseTabs.List
      className={cn("relative flex flex-row border-b border-border", className)}
      {...props}
    />
  );
}

function Tab({ className, ...props }: ComponentProps<typeof BaseTabs.Tab>) {
  return (
    <BaseTabs.Tab
      className={cn(
        "text-style-eyebrow",
        "px-4 py-3 rounded-sm",
        "cursor-pointer select-none",
        "text-fg-muted hover:text-fg",
        "transition-colors duration-150",
        // See Button: outline-color pinned to accent in base so it doesn't
        // animate from currentColor to var(--accent) on focus.
        "outline-accent outline-offset-2 focus-visible:outline-2",
        "data-[selected]:text-accent",
        "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}

function Indicator({ className, ...props }: ComponentProps<typeof BaseTabs.Indicator>) {
  return (
    <BaseTabs.Indicator
      className={cn(
        "absolute bottom-0 h-0.5 bg-accent",
        "transition-all duration-200",
        "left-(--active-tab-left) w-(--active-tab-width)",
        className,
      )}
      {...props}
    />
  );
}

function Panel({ className, ...props }: ComponentProps<typeof BaseTabs.Panel>) {
  return (
    <BaseTabs.Panel
      className={cn(
        "pt-6 rounded-sm",
        "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
        className,
      )}
      {...props}
    />
  );
}

export const Tabs = Object.assign(Root, {
  List,
  Tab,
  Indicator,
  Panel,
});
