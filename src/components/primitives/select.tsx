import { Select as BaseSelect } from "@base-ui/react/select";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import type { ComponentProps } from "react";
import { cn } from "@src/lib/cn";

// Form-control select built on Base UI. Trigger visually mirrors `Input`
// (same border / focus / size tokens) so the two primitives compose
// cleanly in forms. The popup borrows the Menu primitive's surface
// styling so dropdowns across the app feel like one family.

type Size = "sm" | "md" | "lg";

const triggerBase = [
  "w-full inline-flex items-center justify-between gap-2 font-serif",
  "bg-surface text-fg",
  "border border-border rounded-sm",
  "transition-colors duration-150",
  "data-[popup-open]:border-accent",
  "outline-accent outline-offset-2 focus-visible:outline-2",
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
].join(" ");

const triggerSize: Record<Size, string> = {
  sm: "h-8 text-sm px-3",
  md: "h-10 text-base px-4",
  lg: "h-12 text-lg px-5",
};

const Root = BaseSelect.Root;
const Portal = BaseSelect.Portal;
const Group = BaseSelect.Group;
const Value = BaseSelect.Value;

type TriggerProps = ComponentProps<typeof BaseSelect.Trigger> & { size?: Size };

function Trigger({ className, size = "md", children, ...props }: TriggerProps) {
  return (
    <BaseSelect.Trigger className={cn(triggerBase, triggerSize[size], className)} {...props}>
      <span className="min-w-0 flex-1 truncate text-left">{children}</span>
      <BaseSelect.Icon className="shrink-0 text-fg-muted transition-transform duration-150 data-[popup-open]:rotate-180">
        <CaretDownIcon weight="light" size={14} />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

function Positioner({ className, ...props }: ComponentProps<typeof BaseSelect.Positioner>) {
  return (
    <BaseSelect.Positioner
      className={cn("z-50 outline-none", className)}
      sideOffset={6}
      {...props}
    />
  );
}

function Popup({ className, ...props }: ComponentProps<typeof BaseSelect.Popup>) {
  return (
    <BaseSelect.Popup
      className={cn(
        // `--anchor-width` is set by base-ui's Positioner — keeps the popup
        // at least as wide as the trigger so item text doesn't reflow.
        "min-w-[var(--anchor-width)] p-1",
        "bg-bg text-fg",
        "border border-border rounded-sm",
        "shadow-md shadow-ink/30",
        "focus-visible:outline-none",
        "transition-[opacity,transform,scale] duration-150 ease-out",
        "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
        "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
        className,
      )}
      {...props}
    />
  );
}

function List({ className, ...props }: ComponentProps<typeof BaseSelect.List>) {
  return (
    <BaseSelect.List
      className={cn(
        // Cap the list height so very long option lists scroll inside the
        // popup instead of pushing it off-screen. `--available-height` is
        // the room remaining in the viewport on the chosen side.
        "flex flex-col max-h-[min(20rem,var(--available-height))] overflow-y-auto",
        className,
      )}
      {...props}
    />
  );
}

function Item({ className, ...props }: ComponentProps<typeof BaseSelect.Item>) {
  return (
    <BaseSelect.Item
      className={cn(
        "flex items-center gap-2 text-sm text-fg",
        "px-3 py-1.5 rounded-sm",
        "cursor-pointer select-none outline-none",
        "transition-colors duration-100",
        "data-[highlighted]:bg-accent-soft data-[highlighted]:text-fg",
        "data-[disabled]:opacity-50 data-[disabled]:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

function ItemText({ className, ...props }: ComponentProps<typeof BaseSelect.ItemText>) {
  return <BaseSelect.ItemText className={cn("flex-1 truncate", className)} {...props} />;
}

function ItemIndicator({ className, ...props }: ComponentProps<typeof BaseSelect.ItemIndicator>) {
  return (
    <BaseSelect.ItemIndicator className={cn("shrink-0 text-accent", className)} {...props}>
      <CheckIcon weight="light" size={14} />
    </BaseSelect.ItemIndicator>
  );
}

function Separator({ className, ...props }: ComponentProps<typeof BaseSelect.Separator>) {
  return <BaseSelect.Separator className={cn("h-px bg-border my-1 -mx-1", className)} {...props} />;
}

function GroupLabel({ className, ...props }: ComponentProps<typeof BaseSelect.GroupLabel>) {
  return (
    <BaseSelect.GroupLabel
      className={cn("text-style-eyebrow text-fg-muted px-3 pt-2 pb-1", className)}
      {...props}
    />
  );
}

export const Select = Object.assign(Root, {
  Trigger,
  Value,
  Portal,
  Positioner,
  Popup,
  List,
  Item,
  ItemText,
  ItemIndicator,
  Separator,
  Group,
  GroupLabel,
});
