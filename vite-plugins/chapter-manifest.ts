import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

/**
 * Scans every chapter `.md` under `public/<slug>/chapters/` and serves the
 * listing as `chapter-manifest.json`. The chapter `.md` files live in
 * `public/` so they're served as static assets (not bundled). The app
 * fetches `chapter-manifest.json` once at boot (see
 * `src/lib/chapter-manifest.ts`) so adding or removing a chapter `.md`
 * only requires redeploying the JSON — no JS rebuild needed.
 *
 * Dev: served on the fly by middleware so edits show up after a refresh.
 * Build: emitted into `dist/` via `generateBundle` so it ships alongside
 * the app shell and the chapter `.md` files copied out of `public/`.
 */
export function chapterManifestPlugin(): Plugin {
  const MANIFEST_PATH = "chapter-manifest.json";
  const publicDir = fileURLToPath(new URL("../public", import.meta.url));

  function buildManifest(): Record<string, string[]> {
    const manifest: Record<string, string[]> = {};
    function walk(dir: string) {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
          walk(full);
        } else if (entry.endsWith(".md")) {
          const rel = relative(publicDir, full).replaceAll("\\", "/");
          // rel = "venomania/chapters/00-prologue/01.md"
          const slash = rel.lastIndexOf("/");
          const dirKey = rel.slice(0, slash);
          const file = rel.slice(slash + 1);
          (manifest[dirKey] ??= []).push(file);
        }
      }
    }
    try {
      walk(publicDir);
    } catch {
      // public/ may not exist yet on first run — fine.
    }
    for (const key in manifest) manifest[key]!.sort();
    return manifest;
  }

  return {
    name: "chapter-manifest",
    configureServer(server) {
      // Serve a freshly-scanned manifest on each request so chapter `.md`
      // additions show up after a page refresh without restarting dev.
      server.middlewares.use(`/${MANIFEST_PATH}`, (_req, res, next) => {
        try {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.end(JSON.stringify(buildManifest()));
        } catch {
          next();
        }
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: MANIFEST_PATH,
        source: JSON.stringify(buildManifest()),
      });
    },
    handleHotUpdate({ file, server }) {
      // When a chapter `.md` is added/removed/edited under public/, force a
      // full reload so the app re-fetches the freshly-scanned manifest.
      if (file.endsWith(".md") && file.includes("/public/")) {
        server.ws.send({ type: "full-reload" });
      }
    },
  };
}
