import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ComponentProps } from "react";
import { cn } from "@src/lib/cn";

const Root = BaseMenu.Root;
const Trigger = BaseMenu.Trigger;
const Portal = BaseMenu.Portal;
const SubmenuRoot = BaseMenu.SubmenuRoot;
const SubmenuTrigger = BaseMenu.SubmenuTrigger;
const Group = BaseMenu.Group;

function Positioner({ className, ...props }: ComponentProps<typeof BaseMenu.Positioner>) {
  return (
    <BaseMenu.Positioner className={cn("z-50 outline-none", className)} sideOffset={6} {...props} />
  );
}

function Popup({ className, ...props }: ComponentProps<typeof BaseMenu.Popup>) {
  return (
    <BaseMenu.Popup
      className={cn(
        "min-w-44 p-1",
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

function Item({ className, ...props }: ComponentProps<typeof BaseMenu.Item>) {
  return (
    <BaseMenu.Item
      className={cn(
        "block text-sm text-fg",
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

function Separator({ className, ...props }: ComponentProps<typeof BaseMenu.Separator>) {
  return <BaseMenu.Separator className={cn("h-px bg-border my-1 -mx-1", className)} {...props} />;
}

function GroupLabel({ className, ...props }: ComponentProps<typeof BaseMenu.GroupLabel>) {
  return (
    <BaseMenu.GroupLabel
      className={cn("text-style-eyebrow text-fg-muted px-3 pt-2 pb-1", className)}
      {...props}
    />
  );
}

export const Menu = Object.assign(Root, {
  Trigger,
  Portal,
  Positioner,
  Popup,
  Item,
  Separator,
  Group,
  GroupLabel,
  SubmenuRoot,
  SubmenuTrigger,
});
