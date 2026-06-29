import type { Chapter } from "@src/lib/schema";
import type { VolumeBundle, VolumeMeta } from "./_shared";

/*
 * Volume registry — dynamic imports so each volume's content (markdown
 * chapters) becomes its own lazy chunk and stays out of the main bundle.
 * The volume / chapter / page route loaders await `getVolumeMeta`
 * (volume detail) and `getVolumeChapter` (page reader) on demand.
 *
 * Lives in `src/routes/_app/library/-volumes/` (dash-prefix folder, excluded
 * from TanStack Router's file-based route generation) so volume declarations
 * sit next to the route files that consume them.
 */

const loaders: Record<string, () => Promise<VolumeBundle>> = {
  "quyen-1": () => import("./quyen-1").then((m) => m.quyen1),
};

export async function getVolumeMeta(id: string): Promise<VolumeMeta | undefined> {
  const load = loaders[id];
  if (!load) return undefined;
  // Text-only volumes ship no heavy manifest (cover / gallery / poetry), so
  // `meta()` resolves to `undefined` — the volume detail page falls back to
  // its slim header + chapter list. The `catch` guards a genuine manifest
  // fetch failure on a volume that does declare one.
  try {
    return await (await load()).meta();
  } catch {
    return undefined;
  }
}

export async function getVolumeChapter(
  volumeId: string,
  chapterId: string,
): Promise<Chapter | undefined> {
  const load = loaders[volumeId];
  if (!load) return undefined;
  const bundle = await load();
  // Chapter not present in this volume's manifest — surface as undefined so
  // route loaders can `throw notFound()`.
  const slim = bundle.slim.chapters.find((c) => c.id === chapterId);
  if (!slim) return undefined;
  return bundle.chapter(chapterId);
}

// Used by the offline-sync flow to enumerate every URL needed to render a
// volume offline. Text-only volumes have no images, so the `images` list is
// always empty; the `chapters` list is the chapter `.md` files (the heavy
// manifest URL is dropped — there is none to fetch).
export async function getVolumeAssets(
  volumeId: string,
): Promise<{ chapters: string[]; images: string[] }> {
  const load = loaders[volumeId];
  if (!load) return { chapters: [], images: [] };
  const bundle = await load();
  const chapters = bundle.chapterUrls().filter((u) => !u.endsWith("/manifest.json"));
  return { chapters, images: [] };
}

const availableSet = new Set(Object.keys(loaders));

export const availableVolumeIds = Array.from(availableSet);

export function isVolumeAvailable(id: string): boolean {
  return availableSet.has(id);
}
