import type { Plugin } from "vite";

/**
 * Inject `<link rel="preload">` tags into `index.html` for the woff2 files
 * that sit on the LCP critical path. Without preload, the browser only
 * discovers the font URL after parsing the bundled CSS, which adds a
 * sequential round-trip to the critical request chain — Lighthouse flags
 * this as ~200ms of avoidable latency. Preloading lets the font fetch
 * start in parallel with the CSS download.
 *
 * The patterns match @fontsource's emitted woff2 filenames (e.g.
 * `inter-latin-400-normal-<hash>.woff2`). Add or remove patterns here as
 * the set of fonts used on first paint changes — body uses EB Garamond,
 * UI captions use Inter; nothing else is needed before LCP.
 */
export function fontPreloadPlugin(patterns: RegExp[]): Plugin {
  let base = "/";

  return {
    name: "font-preload",
    apply: "build",
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: "post",
      handler(_html, ctx) {
        if (!ctx.bundle) return;
        const matched: string[] = [];
        for (const fileName of Object.keys(ctx.bundle)) {
          if (patterns.some((p) => p.test(fileName))) {
            matched.push(fileName);
          }
        }
        return matched.map((fileName) => ({
          tag: "link",
          attrs: {
            rel: "preload",
            href: `${base}${fileName}`,
            as: "font",
            type: "font/woff2",
            crossorigin: "",
          },
          injectTo: "head-prepend",
        }));
      },
    },
  };
}
