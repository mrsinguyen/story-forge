import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { CaretDownIcon } from "@phosphor-icons/react";
import type { ComponentProps } from "react";
import { cn } from "@src/lib/cn";

function Root({ className, ...props }: ComponentProps<typeof BaseAccordion.Root>) {
  return (
    <BaseAccordion.Root
      className={cn(
        "flex flex-col rounded-sm border border-border bg-bg overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

function Item({ className, ...props }: ComponentProps<typeof BaseAccordion.Item>) {
  return (
    <BaseAccordion.Item
      className={cn("border-b border-border last:border-b-0", className)}
      {...props}
    />
  );
}

function Header({ className, ...props }: ComponentProps<typeof BaseAccordion.Header>) {
  return <BaseAccordion.Header className={cn("m-0", className)} {...props} />;
}

function Trigger({ className, children, ...props }: ComponentProps<typeof BaseAccordion.Trigger>) {
  return (
    <BaseAccordion.Trigger
      className={cn(
        "group flex w-full items-center justify-between gap-3",
        "text-left text-style-body text-fg",
        "px-5 py-4 cursor-pointer",
        "hover:bg-surface transition-colors duration-150",
        "outline-accent outline-offset-2 focus-visible:outline-2",
        className,
      )}
      {...props}
    >
      {children}
      <CaretDownIcon
        size={16}
        weight="light"
        className="shrink-0 transition-transform duration-200 group-data-[panel-open]:rotate-180"
      />
    </BaseAccordion.Trigger>
  );
}

function Panel({ className, children, ...props }: ComponentProps<typeof BaseAccordion.Panel>) {
  return (
    <BaseAccordion.Panel
      className={cn(
        "overflow-hidden",
        "h-[var(--accordion-panel-height)]",
        "transition-[height] duration-300 ease-out",
        "data-[starting-style]:h-0 data-[ending-style]:h-0",
        className,
      )}
      {...props}
    >
      <div className="px-5 pb-5 pt-1">{children}</div>
    </BaseAccordion.Panel>
  );
}

export const Accordion = Object.assign(Root, {
  Item,
  Header,
  Trigger,
  Panel,
});
