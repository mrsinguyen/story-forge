import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { aliasCacheGuardPlugin } from "./vite-plugins/alias-cache-guard.ts";
import { chapterManifestPlugin } from "./vite-plugins/chapter-manifest.ts";
import { fontPreloadPlugin } from "./vite-plugins/font-preload.ts";
import { phosphorStripWeightsPlugin } from "./vite-plugins/phosphor-strip-weights.ts";
import { pwaSetupPlugin } from "./vite-plugins/pwa-setup.ts";

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the site under /<repo-name>/. The deploy workflow sets
  // BASE_URL accordingly; locally it falls back to "/".
  base: process.env.BASE_URL ?? "/",
  // Path aliases — keep in sync with tsconfig.app.json compilerOptions.paths.
  resolve: {
    alias: {
      "@src": fileURLToPath(new URL("./src", import.meta.url)),
      "@app": fileURLToPath(new URL("./src/routes/_app", import.meta.url)),
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: { ignorePatterns: ["src/routeTree.gen.ts"] },
  lint: {
    ignorePatterns: ["src/routeTree.gen.ts"],
    options: { typeAware: true, typeCheck: true },
  },
  plugins: [
    aliasCacheGuardPlugin(),
    // Strip unused Phosphor icon weights at build time — keep this list in
    // sync with `weight="…"` usage in the codebase (run
    // `grep -rohE 'weight="[a-z]+"' src` to audit).
    phosphorStripWeightsPlugin({ weights: ["bold", "duotone", "fill", "light"] }),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    chapterManifestPlugin(),
    pwaSetupPlugin(),
    fontPreloadPlugin([
      // Body text — EB Garamond regular, the only weight rendered on first
      // paint. Vietnamese prose pulls glyphs from both the latin subset (base
      // letters, punctuation) and the vietnamese subset (diacritics like ể,
      // ậ, ơ), so both are on the LCP path. Italic / 500 / 600 cuts swap in
      // lazily once their callsites mount and don't need preloading.
      /eb-garamond-latin-400-normal-[^/]+\.woff2$/,
      /eb-garamond-vietnamese-400-normal-[^/]+\.woff2$/,
      // UI captions / nav labels — Inter regular, both subsets for the same
      // reason. 500 / 600 are in-page UI weights and aren't on the LCP path.
      /inter-latin-400-normal-[^/]+\.woff2$/,
      /inter-vietnamese-400-normal-[^/]+\.woff2$/,
    ]),
  ],
});
