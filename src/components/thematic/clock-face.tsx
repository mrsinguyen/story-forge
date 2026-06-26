import { cn } from "@src/lib/cn";

type Props = {
  className?: string;
};

/**
 * Decorative clock face — twelve tick marks, a static hour hand pointing to
 * 3 o'clock, and an animated minute hand that ticks once per second around
 * the dial (60 discrete steps per rotation). Sized in `em` so it scales with
 * the surrounding text. Purely ornamental (aria-hidden).
 */
export function ClockFace({ className }: Props) {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const inner = 22;
    const outer = 27;
    return {
      x1: 30 + Math.cos(angle) * inner,
      y1: 30 + Math.sin(angle) * inner,
      x2: 30 + Math.cos(angle) * outer,
      y2: 30 + Math.sin(angle) * outer,
    };
  });

  return (
    <svg
      aria-hidden
      viewBox="0 0 60 60"
      className={cn(
        "text-accent pointer-events-none absolute top-1/2 left-1/2 h-[0.55em] w-[0.55em] -translate-x-[44%] -translate-y-[68%]",
        className,
      )}
    >
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      ))}
      {/* Hour hand — short, right (3 o'clock) */}
      <line
        x1="30"
        y1="30"
        x2="40"
        y2="30"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Minute hand — long, up (12 o'clock), animated */}
      <line
        x1="30"
        y1="30"
        x2="30"
        y2="15"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        style={{
          transformOrigin: "30px 30px",
          transformBox: "view-box",
          animation: "spin 32s steps(60, end) infinite",
        }}
      />
      <circle cx="30" cy="30" r="2.5" fill="currentColor" />
    </svg>
  );
}
