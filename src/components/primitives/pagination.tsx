import { Button as BaseButton } from "@base-ui/react/button";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { cn } from "@src/lib/cn";

type Size = "sm" | "md" | "lg";

type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  siblings?: number;
  size?: Size;
  className?: string;
  "aria-label"?: string;
};

const itemBase = [
  "inline-flex items-center justify-center tabular-nums",
  "transition-colors duration-150 cursor-pointer select-none rounded-sm",
  // See Button: outline-color pinned to accent in base so it doesn't
  // animate from currentColor to var(--accent) on focus.
  "outline-accent outline-offset-2",
  "focus-visible:outline-2",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
].join(" ");

// Each non-sm size shrinks one tier on phones so the row fits in a 360–390px
// viewport without wrapping. The advertised `size` only kicks in at the `sm`
// breakpoint; below that, everything compacts to the smallest dimensions.
const sizeClasses: Record<Size, { item: string; icon: number; text: string }> = {
  sm: { item: "h-8 min-w-8 px-2", icon: 14, text: "text-sm" },
  md: {
    item: "h-8 min-w-8 px-2 sm:h-10 sm:min-w-10 sm:px-3",
    icon: 16,
    text: "text-sm sm:text-base",
  },
  lg: {
    item: "h-10 min-w-10 px-3 sm:h-12 sm:min-w-12 sm:px-4",
    icon: 18,
    text: "text-base sm:text-lg",
  },
};

const inactive = "text-fg hover:bg-surface active:bg-surface";
const current = "bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active";

export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblings = 1,
  size = "md",
  className,
  "aria-label": ariaLabel = "Pagination",
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const items = buildRange(page, pageCount, siblings);
  const sz = sizeClasses[size];

  return (
    <nav
      aria-label={ariaLabel}
      // `flex-wrap` lets the row break onto a second line when the page list
      // is wider than the container — keeps mobile from overflowing the
      // viewport when there are 7+ buttons. `justify-center` keeps the
      // wrapped row visually centered with the first row.
      className={cn("flex flex-wrap items-center justify-center gap-1", className)}
    >
      <BaseButton
        nativeButton
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className={cn(itemBase, sz.item, inactive)}
      >
        <CaretLeftIcon size={sz.icon} weight="light" />
      </BaseButton>

      {items.map((item, i) => {
        if (item === "left-ellipsis" || item === "right-ellipsis") {
          return (
            <span
              key={`${item}-${i}`}
              aria-hidden
              className={cn(
                "inline-flex items-center justify-center text-fg-muted",
                sz.item,
                sz.text,
              )}
            >
              …
            </span>
          );
        }
        const isCurrent = item === page;
        return (
          <BaseButton
            key={item}
            nativeButton
            type="button"
            aria-label={`Go to page ${item}`}
            aria-current={isCurrent ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className={cn(itemBase, sz.item, sz.text, isCurrent ? current : inactive)}
          >
            {item}
          </BaseButton>
        );
      })}

      <BaseButton
        nativeButton
        type="button"
        aria-label="Next page"
        disabled={page >= pageCount}
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        className={cn(itemBase, sz.item, inactive)}
      >
        <CaretRightIcon size={sz.icon} weight="light" />
      </BaseButton>
    </nav>
  );
}

type Item = number | "left-ellipsis" | "right-ellipsis";

function buildRange(currentPage: number, total: number, siblings: number): Item[] {
  // first + leftEllipsis + (2*siblings + 1 around current) + rightEllipsis + last
  const totalSlots = 5 + 2 * siblings;
  if (total <= totalSlots) return rangeOf(1, total);

  const leftSibling = Math.max(currentPage - siblings, 1);
  const rightSibling = Math.min(currentPage + siblings, total);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < total - 1;

  if (!showLeftDots && showRightDots) {
    const leftCount = 3 + 2 * siblings;
    return [...rangeOf(1, leftCount), "right-ellipsis", total];
  }
  if (showLeftDots && !showRightDots) {
    const rightCount = 3 + 2 * siblings;
    return [1, "left-ellipsis", ...rangeOf(total - rightCount + 1, total)];
  }
  return [1, "left-ellipsis", ...rangeOf(leftSibling, rightSibling), "right-ellipsis", total];
}

function rangeOf(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
