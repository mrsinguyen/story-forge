import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

/**
 * Vite's dep prebundle cache is keyed on lockfile + config hash, but in
 * practice we've hit cases where editing `resolve.alias` mid-session leaves
 * the prebundle pointing at stale modules — most visibly as a "two copies
 * of React" error after adding `@app`. This plugin fingerprints the alias
 * config on each start, compares to the last-seen value, and wipes
 * `node_modules/.vite{,-temp}` if it changed, so aliasing edits don't
 * need a manual cache clean.
 */
export function aliasCacheGuardPlugin(): Plugin {
  return {
    name: "alias-cache-guard",
    enforce: "pre",
    config(config) {
      const aliasFingerprint = JSON.stringify(config.resolve?.alias ?? {});
      const hash = createHash("sha1").update(aliasFingerprint).digest("hex");
      const cacheRoot = resolve("node_modules");
      const stampFile = resolve(cacheRoot, ".vite", "alias.hash");

      const previous = existsSync(stampFile) ? readFileSync(stampFile, "utf-8").trim() : null;
      if (previous !== hash) {
        for (const dir of [".vite", ".vite-temp"]) {
          rmSync(resolve(cacheRoot, dir), { recursive: true, force: true });
        }
        mkdirSync(resolve(cacheRoot, ".vite"), { recursive: true });
        writeFileSync(stampFile, hash);
      }
      return null;
    },
  };
}
