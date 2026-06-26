import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import type { ComponentProps, ReactNode, Ref } from "react";
import { cn } from "@src/lib/cn";

type ScrollAreaProps = ComponentProps<typeof BaseScrollArea.Root> & {
  children?: ReactNode;
  viewportClassName?: string;
  viewportRef?: Ref<HTMLDivElement>;
  // ID consumed by TanStack Router's scroll restoration. When set, the
  // viewport (the actual scrolling element) is tagged with
  // `data-scroll-restoration-id` so the router caches and restores scrollY
  // for this container on back/forward navigation. Leave undefined for
  // transient scroll areas (drawers, dialogs) that don't need restoration.
  scrollRestorationId?: string;
};

const scrollbarBase = [
  "flex touch-none select-none p-0.5",
  "transition-opacity duration-200 ease-out",
  "opacity-0",
  "data-[hovering]:opacity-100 data-[scrolling]:opacity-100",
  "data-[orientation=vertical]:w-2",
  "data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:flex-col",
].join(" ");

const thumbBase = "flex-1 rounded-full bg-border hover:bg-fg-muted transition-colors";

export function ScrollArea({
  className,
  children,
  viewportClassName,
  viewportRef,
  scrollRestorationId,
  ...props
}: ScrollAreaProps) {
  return (
    <BaseScrollArea.Root className={cn("relative overflow-hidden", className)} {...props}>
      <BaseScrollArea.Viewport
        ref={viewportRef}
        data-scroll-restoration-id={scrollRestorationId}
        // base-ui makes the viewport focusable (tabindex=0) for keyboard
        // scrolling. That puts the entire content region in the tab order
        // with no useful visual cue (outlining the whole page is worse than
        // useless), so pull it out of tab order. Mouse / wheel / keyboard
        // arrows on a focused descendant still scroll normally.
        tabIndex={-1}
        className={cn("h-full w-full overscroll-contain outline-none", viewportClassName)}
      >
        <BaseScrollArea.Content>{children}</BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar orientation="vertical" className={scrollbarBase}>
        <BaseScrollArea.Thumb className={thumbBase} />
      </BaseScrollArea.Scrollbar>
      <BaseScrollArea.Scrollbar orientation="horizontal" className={scrollbarBase}>
        <BaseScrollArea.Thumb className={thumbBase} />
      </BaseScrollArea.Scrollbar>
      <BaseScrollArea.Corner className="bg-bg" />
    </BaseScrollArea.Root>
  );
}
