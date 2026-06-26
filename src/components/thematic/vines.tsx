import type { ReactNode } from "react";
import { cn } from "@src/lib/cn";

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type Props = {
  children: ReactNode;
  className?: string;
  corner?: Corner;
};

// Heart-shaped leaf path. Indent (stem-attachment point) at (0, 0); tip at
// (0, 16) so a rotation around the origin orients the tip outward.
const HEART_LEAF =
  "M 0 0 C -3 -3, -9 -3, -9 3 C -9 10, 0 16, 0 16 C 0 16, 9 10, 9 3 C 9 -3, 3 -3, 0 0 Z";

// Vine drawn for the top-right corner. The SVG is centered on the corner
// (viewBox point (60, 60)). The stem starts in the bottom-right quadrant
// (running up the right edge of the child), curls around the corner, and
// trails into the top-left quadrant (running left along the top edge), then
// finishes with a small inward spiral so the vine occupies less surrounding
// space.
const STEM =
  "M 64 96 C 68 86, 60 76, 64 68 C 68 62, 62 56, 52 56 C 40 54, 28 60, 22 56 C 16 52, 14 48, 20 44";
const TERMINAL_CURL = "M 20 44 C 28 42, 28 50, 22 50";

const LEAVES: Array<{ x: number; y: number; angle: number; size: number }> = [
  // Along the right edge — tips point right, away from the child.
  { x: 69, y: 86, angle: -90, size: 0.75 },
  { x: 67, y: 70, angle: -110, size: 0.85 },
  // At the curl — tip points up-right.
  { x: 58, y: 58, angle: -135, size: 0.85 },
  // Along the top edge — tips point up.
  { x: 38, y: 54, angle: -170, size: 0.75 },
  { x: 22, y: 54, angle: 170, size: 0.7 },
  // Near the inward spiral — tip points up-left.
  { x: 18, y: 42, angle: 135, size: 0.6 },
];

// Center the SVG on the named corner, then mirror on the relevant axes for
// the other three corners so the vine consistently hugs the two edges
// meeting at that corner.
const cornerClass: Record<Corner, string> = {
  "top-right": "right-0 top-0 translate-x-1/2 -translate-y-1/2",
  "top-left": "left-0 top-0 -translate-x-1/2 -translate-y-1/2 -scale-x-100",
  "bottom-right": "right-0 bottom-0 translate-x-1/2 translate-y-1/2 -scale-y-100",
  "bottom-left": "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 -scale-x-100 -scale-y-100",
};

/**
 * Wraps a child element with a curling vine that hugs the two edges meeting
 * at the specified corner — running along one edge, curling around the
 * corner, and trailing along the other. Heart-shaped leaves dot the stem
 * and a small curl finishes the terminal end. Purely decorative
 * (aria-hidden, pointer-events-none).
 */
export function Vines({ children, className, corner = "top-right" }: Props) {
  return (
    <span className={cn("relative inline-block", className)}>
      {children}
      <Vine corner={corner} />
    </span>
  );
}

function Vine({ corner }: { corner: Corner }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 120"
      overflow="visible"
      className={cn(
        "pointer-events-none absolute h-[6em] w-[6em] text-[#5a7340]",
        cornerClass[corner],
      )}
    >
      <path d={STEM} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path
        d={TERMINAL_CURL}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {LEAVES.map((l, i) => (
        <path
          key={i}
          d={HEART_LEAF}
          fill="currentColor"
          transform={`translate(${l.x}, ${l.y}) rotate(${l.angle}) scale(${l.size})`}
        />
      ))}
    </svg>
  );
}
