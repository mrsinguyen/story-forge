import { Dialog } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";
import { cn } from "@src/lib/cn";

type Side = "right" | "left";

type PopupProps = ComponentProps<typeof Dialog.Popup> & {
  side?: Side;
};

const backdropBase = [
  "fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm",
  "transition-opacity duration-300 ease-out",
  "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
].join(" ");

const popupBase = [
  "fixed top-0 z-50 flex h-dvh w-96 max-w-[90vw] flex-col gap-4 p-6",
  "bg-bg text-fg",
  "shadow-2xl shadow-ink/40",
  "transition-transform duration-300 ease-out",
  "focus-visible:outline-none",
].join(" ");

const popupSides: Record<Side, string> = {
  right: [
    "right-0 border-l border-border",
    "data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full",
  ].join(" "),
  left: [
    "left-0 border-r border-border",
    "data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full",
  ].join(" "),
};

function Root(props: ComponentProps<typeof Dialog.Root>) {
  return <Dialog.Root {...props} />;
}

function Trigger(props: ComponentProps<typeof Dialog.Trigger>) {
  return <Dialog.Trigger {...props} />;
}

function Portal(props: ComponentProps<typeof Dialog.Portal>) {
  return <Dialog.Portal {...props} />;
}

function Backdrop({ className, ...props }: ComponentProps<typeof Dialog.Backdrop>) {
  return <Dialog.Backdrop className={cn(backdropBase, className)} {...props} />;
}

function Popup({ className, side = "right", ...props }: PopupProps) {
  return <Dialog.Popup className={cn(popupBase, popupSides[side], className)} {...props} />;
}

function Title({ className, ...props }: ComponentProps<typeof Dialog.Title>) {
  return <Dialog.Title className={cn("text-style-heading-2 text-fg", className)} {...props} />;
}

function Description({ className, ...props }: ComponentProps<typeof Dialog.Description>) {
  return (
    <Dialog.Description className={cn("text-style-lead text-fg-muted", className)} {...props} />
  );
}

const closeBase = [
  "inline-flex items-center justify-center self-end",
  "h-8 px-4 rounded-sm text-sm",
  "font-display tracking-[0.15em]",
  "text-fg hover:bg-surface active:bg-surface",
  "transition-colors duration-150 cursor-pointer select-none",
  // See Button: outline-color pinned to accent in base so it doesn't
  // animate from currentColor to var(--accent) on focus.
  "outline-accent outline-offset-2",
  "focus-visible:outline-2",
].join(" ");

function Close({ className, children, ...props }: ComponentProps<typeof Dialog.Close>) {
  return (
    <Dialog.Close className={cn(closeBase, className)} {...props}>
      {children ?? "Close"}
    </Dialog.Close>
  );
}

export const Drawer = Object.assign(Root, {
  Trigger,
  Portal,
  Backdrop,
  Popup,
  Title,
  Description,
  Close,
});
