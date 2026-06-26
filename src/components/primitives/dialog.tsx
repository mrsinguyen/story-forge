import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";
import { cn } from "@src/lib/cn";

const Root = BaseDialog.Root;
const Trigger = BaseDialog.Trigger;
const Portal = BaseDialog.Portal;
const Close = BaseDialog.Close;

function Backdrop({ className, ...props }: ComponentProps<typeof BaseDialog.Backdrop>) {
  return (
    <BaseDialog.Backdrop
      className={cn(
        "fixed inset-0 z-40 bg-ink/60 backdrop-blur-[2px]",
        "transition-opacity duration-200 ease-out",
        "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function Popup({ className, ...props }: ComponentProps<typeof BaseDialog.Popup>) {
  return (
    <BaseDialog.Popup
      className={cn(
        "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
        "w-[calc(100vw-2rem)] max-w-md",
        "bg-bg text-fg",
        "border border-border rounded-sm",
        "shadow-2xl shadow-ink/40",
        "p-7",
        "focus-visible:outline-none",
        "transition-[opacity,transform,scale] duration-200 ease-out",
        "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
        "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
        className,
      )}
      {...props}
    />
  );
}

function Title({ className, ...props }: ComponentProps<typeof BaseDialog.Title>) {
  return <BaseDialog.Title className={cn("text-style-heading-3 text-fg", className)} {...props} />;
}

function Description({ className, ...props }: ComponentProps<typeof BaseDialog.Description>) {
  return (
    <BaseDialog.Description
      className={cn("text-style-body mt-2 text-fg-muted", className)}
      {...props}
    />
  );
}

export const Dialog = Object.assign(Root, {
  Trigger,
  Portal,
  Backdrop,
  Popup,
  Title,
  Description,
  Close,
});
