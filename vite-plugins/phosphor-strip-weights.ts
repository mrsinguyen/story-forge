import type { Plugin } from "vite";

const PHOSPHOR_DEFS = "/@phosphor-icons/react/dist/defs/";

const ALL_WEIGHTS = ["bold", "duotone", "fill", "light", "regular", "thin"] as const;
export type PhosphorWeight = (typeof ALL_WEIGHTS)[number];

export interface PhosphorStripWeightsOptions {
  /** Weights to keep. Anything not listed is removed from each icon's weight Map. */
  weights: PhosphorWeight[];
}

/**
 * Phosphor's per-icon defs files (`@phosphor-icons/react/dist/defs/<Name>.es.js`)
 * inline SVG paths for all six weights — bold/duotone/fill/light/regular/thin —
 * inside a single `Map([[ "weight", <jsx> ], ...])`. Bundlers can't statically
 * prove which key the runtime `weights.get(weight)` lookup hits, so dead-code
 * elimination keeps every weight even when only one is rendered. This plugin
 * rewrites each defs file at build time, dropping Map entries whose weight
 * isn't in the allowlist. Roughly proportional savings: keeping 4 of 6 weights
 * cuts the icon footprint by ~33%.
 *
 * If a callsite later renders a stripped weight, the icon silently renders
 * nothing — keep the allowlist in sync with `weight=` usage in the codebase.
 */
export function phosphorStripWeightsPlugin(options: PhosphorStripWeightsOptions): Plugin {
  const allowed = new Set<string>(options.weights);
  return {
    name: "phosphor-strip-weights",
    enforce: "pre",
    transform(code, id) {
      if (!id.includes(PHOSPHOR_DEFS)) return;
      const stripped = stripWeights(code, allowed);
      if (stripped === code) return;
      return { code: stripped, map: null };
    },
  };
}

// Each entry in a defs Map literal looks like:
//   \n  [\n    "<weight>",\n<...createElement(...)...>\n  ](,)?
// Phosphor's generated indentation is uniform across every defs file in
// @phosphor-icons/react@2.x — relying on it lets us skip a JS parser. The
// `[\s\S]*?` body is non-greedy so it stops at the first `\n  ]` (an entry
// closer at 2-space indent), and inner `createElement` content sits at
// >=4-space indent so it can't accidentally match.
const ENTRY_RE = /\n {2}\[\n {4}"(\w+)",\n[\s\S]*?\n {2}\](,)?/g;

function stripWeights(code: string, allowed: Set<string>): string {
  let changed = false;
  const out = code.replace(ENTRY_RE, (match, weight: string) => {
    if (allowed.has(weight)) return match;
    changed = true;
    return "";
  });
  if (!changed) return code;
  // After removing entries, a leading entry may still carry its `,` because
  // its follower was dropped — yielding `<entry>,\n])`. Trim that before the
  // array close so the resulting Map literal stays well-formed.
  return out.replace(/,(\s*\n\])/g, "$1");
}
