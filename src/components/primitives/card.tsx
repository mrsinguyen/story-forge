import type { ComponentProps } from "react";
import { cn } from "@src/lib/cn";

type Variant = "flat" | "interactive";

type CardProps = ComponentProps<"div"> & {
  variant?: Variant;
};

const base = "flex h-full flex-col rounded-sm border border-border bg-surface text-fg";

const variants: Record<Variant, string> = {
  flat: "",
  interactive:
    "cursor-pointer transition-colors duration-150 hover:border-accent hover:bg-accent-soft",
};

export function Card({ className, variant = "flat", ...props }: CardProps) {
  return <div className={cn(base, variants[variant], className)} {...props} />;
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-5 pb-3", className)} {...props} />;
}

function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("text-style-heading-3 text-fg", className)} {...props} />;
}

function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-style-caption mt-1 text-fg-muted", className)} {...props} />;
}

function CardBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex-1 p-5 py-3 text-style-body", className)} {...props} />;
}

function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center gap-3 border-t border-border p-5 pt-3", className)}
      {...props}
    />
  );
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Body = CardBody;
Card.Footer = CardFooter;
