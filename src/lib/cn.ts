import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/*
 * Extend tailwind-merge so it knows our `text-style-*` utilities are their own
 * group, NOT a text-color (the default text-* fallback). Without this, cn() would
 * dedupe e.g. `text-bone text-style-caption` against each other and drop one,
 * since both look like `text-{value}` to twMerge.
 */
const twMerge = extendTailwindMerge<"text-style">({
  extend: {
    classGroups: {
      "text-style": [
        {
          "text-style": [
            "display",
            "heading-1",
            "heading-2",
            "heading-3",
            "heading-4",
            "lead",
            "body",
            "quote",
            "caption",
            "eyebrow",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
