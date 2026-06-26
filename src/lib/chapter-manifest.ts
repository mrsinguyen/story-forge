/**
 * Runtime chapter manifest — replaces the previous build-time virtual module.
 *
 * The Vite plugin in `vite.config.ts` serves `chapter-manifest.json` from
 * `public/<slug>/chapters/**\/*.md` (via dev middleware in dev, emitted into
 * `dist/` at build). The app fetches it once at boot via `loadChapterManifest`,
 * then every consumer reads from the in-memory cache via `getChapterManifest`.
 *
 * Slim views and `Chapter()` factories read the manifest lazily, so adding
 * or removing `.md` files no longer requires a JS rebuild — only a refresh
 * of the deployed `chapter-manifest.json`.
 */

export type ChapterManifest = Record<string, string[]>;

let manifest: ChapterManifest = {};

export function getChapterManifest(): ChapterManifest {
  return manifest;
}

export async function loadChapterManifest(): Promise<void> {
  const url = `${import.meta.env.BASE_URL}chapter-manifest.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    manifest = (await res.json()) as ChapterManifest;
  } catch (err) {
    // Fail soft — keep the empty default. Volume / chapter routes will throw
    // when they try to fetch a missing chapter, surfacing the failure
    // through the route's errorComponent.
    console.error("Failed to load chapter manifest:", err);
  }
}
