import { GearIcon, GearSixIcon } from "@phosphor-icons/react";
import { cn } from "@src/lib/cn";

type Props = {
  size?: number;
  count?: 2 | 3;
  className?: string;
  // Multiplier applied to all gear spin durations. <1 = faster, >1 = slower.
  speed?: number;
  // Extra small gears chained to the right of the medium gear, each meshing
  // with the previous and shrinking in size.
  chain?: number;
};

/**
 * Decorative cluster of meshing gears for the home / hero areas — purely
 * ornamental (aria-hidden). `count` toggles between a two-gear pair and a
 * three-gear cluster. Neighbors are offset by `(r1 + r2)` from the central
 * gear so their teeth visually touch, and rotate in opposite directions so
 * the cluster reads as a mechanical gear train.
 */
export function ClockworkOrnament({
  size = 80,
  count = 2,
  className,
  speed = 1,
  chain = 0,
}: Props) {
  const big = 18 * speed;
  const med = 12 * speed;
  const sml = 9 * speed;
  const medium = Math.round(size * 0.55);
  const small = Math.round(size * 0.4);

  // Outer radius of the visible gear ≈ icon size / 2.
  const bigR = size / 2;
  const mediumR = medium / 2;
  const smallR = small / 2;

  // Phosphor gear icons leave some padding inside their viewBox, so the visible
  // gear is smaller than `size/2`. Multiply mesh distances by this factor so
  // adjacent gears appear to actually touch instead of leaving a visible gap.
  const mesh = 0.88;

  // Medium gear meshes with the big gear at ~45° down-right.
  const mDist = (bigR + mediumR) * mesh;
  const mDx = mDist * Math.SQRT1_2;
  const mDy = mDist * Math.SQRT1_2;
  const mediumCx = bigR + mDx;
  const mediumCy = bigR + mDy;
  const mediumLeft = mediumCx - mediumR;
  const mediumTop = mediumCy - mediumR;

  // Small gear meshes with the big gear at ~-15° (slightly above horizontal,
  // to the right). Shallow angle so the gear stays inside the bounding box.
  const sDist = (bigR + smallR) * mesh;
  const sAngle = (-15 * Math.PI) / 180;
  const sDx = sDist * Math.cos(sAngle);
  const sDy = sDist * Math.sin(sAngle);
  const smallLeft = bigR + sDx - smallR;
  const smallTop = bigR + sDy - smallR;

  // Chain of extra gears extending right from the medium gear. Each is 70% of
  // the previous gear's size, meshes with the prior gear, and alternates spin
  // direction (medium spins reverse, so first chained spins forward, etc.).
  const chainGears: { size: number; left: number; top: number; reverse: boolean; dur: number }[] =
    [];
  {
    let prevR = mediumR;
    let prevCx = mediumCx;
    let prevCy = mediumCy;
    let prevSize = medium;
    let reverse = false;
    let dur = med * 0.7;
    for (let i = 0; i < chain; i++) {
      const nextSize = Math.max(8, Math.round(prevSize * 0.7));
      const nextR = nextSize / 2;
      const cx = prevCx + (prevR + nextR) * mesh;
      const cy = prevCy;
      chainGears.push({
        size: nextSize,
        left: cx - nextR,
        top: cy - nextR,
        reverse,
        dur,
      });
      prevR = nextR;
      prevCx = cx;
      prevCy = cy;
      prevSize = nextSize;
      reverse = !reverse;
      dur *= 0.7;
    }
  }

  // Chain gears intentionally overflow the bounding box on the right so that
  // anchoring the ornament (e.g. via `right-full`) keeps the big gear pinned
  // next to its neighbouring text — the chain just trails into/under the text.
  const width = Math.ceil(Math.max(size, mediumLeft + medium, count === 3 ? smallLeft + small : 0));
  const height = Math.ceil(Math.max(size, mediumTop + medium, count === 3 ? smallTop + small : 0));

  return (
    <div
      aria-hidden
      className={cn("relative inline-block text-accent", className)}
      style={{ width, height }}
    >
      <GearSixIcon
        size={size}
        weight="light"
        className="absolute"
        style={{ top: 0, left: 0, animation: `spin ${big}s linear infinite` }}
      />
      <GearIcon
        size={medium}
        weight="light"
        className="absolute text-accent-strong"
        style={{
          left: Math.round(mediumLeft),
          top: Math.round(mediumTop),
          animation: `spin ${med}s linear infinite reverse`,
        }}
      />
      {count === 3 ? (
        <GearSixIcon
          size={small}
          weight="light"
          className="absolute text-accent-strong"
          style={{
            left: Math.round(smallLeft),
            top: Math.round(smallTop),
            animation: `spin ${sml}s linear infinite reverse`,
          }}
        />
      ) : null}
      {chainGears.map((g, i) => (
        <GearSixIcon
          key={i}
          size={g.size}
          weight="light"
          className="absolute text-accent-strong"
          style={{
            left: Math.round(g.left),
            top: Math.round(g.top),
            animation: `spin ${g.dur}s linear infinite${g.reverse ? " reverse" : ""}`,
          }}
        />
      ))}
    </div>
  );
}
