import type {
  ArtworkPage,
  Chapter as ChapterType,
  ImageAsset,
  Page,
  Poetry,
  Sin,
  TitlePage,
  Translation,
} from "@src/lib/schema";
import { asset } from "@src/lib/asset";
import { getChapterManifest } from "@src/lib/chapter-manifest";

const ILLUSTRATION_RE = /^\s*<!--\s*illustration:\s*([\w-]+)\s*-->\s*$/;
const SONG_CUE_RE = /<!--\s*songCue:\s*([\w-]+)\s*-->/;

/**
 * Builds a chapter's pages from per-page raw markdown strings. Each input is
 * one page in reading order: either prose, or a single line of the form
 * `<!-- illustration: illustration-N -->` that resolves against the supplied
 * `illustrations` map.
 *
 * Either kind of page may also carry a `<!-- songCue: song-id -->` directive
 * (anywhere in the file, conventionally at the top). The directive is
 * stripped from the body and surfaced as `Page.songCue` so the audio dock
 * can highlight that song when the page mounts. Unknown song ids fail soft —
 * the dock won't render a cue rather than throwing.
 */
export function makePagesBuilder(illustrations: Record<string, ImageAsset>) {
  return (...rawPages: string[]): Page[] =>
    rawPages.map((raw, i) => {
      let body = raw;
      let songCue: string | undefined;
      const cueMatch = body.match(SONG_CUE_RE);
      if (cueMatch) {
        songCue = cueMatch[1];
        body = body.replace(cueMatch[0], "");
      }
      body = body.trim();

      const m = body.match(ILLUSTRATION_RE);
      if (m) {
        const id = m[1]!;
        const illustration = illustrations[id];
        if (!illustration) throw new Error(`Unknown illustration "${id}"`);
        return {
          number: i + 1,
          layout: "illustration",
          illustration,
          ...(songCue ? { songCue } : {}),
        };
      }
      return {
        number: i + 1,
        layout: "prose",
        text: body,
        ...(songCue ? { songCue } : {}),
      };
    });
}

// Every novel volume's static assets (chapter `.md`, manifest, images) live
// under `public/novels/<slug>/`. Volume files keep referring to the bare
// slug; the prefix is applied here so manifest keys and fetch URLs stay
// consistent across the codebase.
const NOVELS_PREFIX = "novels/";

function manifestKey(prefix: string): string {
  // Strip leading "./" and trailing "/" — volume `pages:` strings come in
  // as e.g. "./cloture-of-yellow/chapters/01-ch1"; manifest keys are
  // public-relative paths like "novels/cloture-of-yellow/chapters/01-ch1".
  return NOVELS_PREFIX + prefix.replace(/^\.?\//, "").replace(/\/$/, "");
}

// Manifest-driven directory listing for chapter pages. The chapter `.md`
// content lives in `public/` (served as static assets, not bundled). The
// Vite plugin `chapterManifestPlugin` scans the public tree and serves the
// listing as `chapter-manifest.json`, fetched at boot.
function pagesUnder(prefix: string): string[] {
  return getChapterManifest()[manifestKey(prefix)] ?? [];
}

export function pageCountUnder(prefix: string): number {
  return pagesUnder(prefix).length;
}

// Same URL shape as the runtime fetch in `Chapter()` — keeps the offline
// pre-fetcher and the reader fetcher pointed at identical URLs so the SW
// cache key matches.
function urlsUnder(prefix: string): string[] {
  const dirKey = manifestKey(prefix);
  return pagesUnder(prefix).map((name) => `${import.meta.env.BASE_URL}${dirKey}/${name}`);
}

type ChapterProps = {
  id: string;
  number: number;
  title: string;
  // Path prefix (relative to `public/`) of the chapter's page directory —
  // e.g. `"./venomania/chapters/01-ch1"`. All `.md` files under that path
  // are listed in `chapter-manifest.json` and fetched at runtime.
  pages: string;
  songIds?: string[];
  illustrations: Record<string, ImageAsset>;
};

/**
 * Single-call chapter factory. Reads the manifest entry for the supplied
 * path prefix, fetches each `.md` file from the public origin in reading
 * order, parses each (prose vs. `<!-- illustration: id -->` directive) using
 * the supplied illustrations, and resolves to the schema's `Chapter` shape.
 */
export async function Chapter({
  id,
  number,
  title,
  pages,
  songIds,
  illustrations,
}: ChapterProps): Promise<ChapterType> {
  const dirKey = manifestKey(pages);
  const filenames = pagesUnder(pages);
  const ordered = await Promise.all(
    filenames.map(async (name) => {
      const url = `${import.meta.env.BASE_URL}${dirKey}/${name}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
      return res.text();
    }),
  );
  return {
    id,
    number,
    title,
    pages: makePagesBuilder(illustrations)(...ordered),
    ...(songIds ? { songIds } : {}),
  };
}

// Chapter declaration inside a Volume — the volume provides the illustrations,
// so each chapter just supplies id / number / title / pages-prefix.
export type VolumeChapter = Omit<ChapterProps, "illustrations">;

// ---------------------------------------------------------------------------
// Volume manifest split: slim (in TS bundle) vs. heavy (in public JSON).
// ---------------------------------------------------------------------------
//
// Slim — everything search, continue-reading, and the catalog need to render
// synchronously. Stays in the TS bundle so those features keep working
// without an async load.
//
// Heavy — hero / poetry / gallery / illustration metadata that's only needed
// once the user opens a volume. Lives in `public/<slug>/manifest.json`,
// fetched lazily and memoized per slug.

export type VolumeSlim = {
  id: string;
  slug: string;
  number: number;

  title: string;
  originalTitle?: string;
  romanizedTitle?: string;

  sin: Sin | null;
  series: string;

  // Public asset directory for this volume — where `manifest.json`, cover,
  // gallery, illustrations, and chapter `.md` files live under
  // `public/novels/`. Defaults to `slug` when omitted; set explicitly when
  // slug and dir name diverge (e.g. slug `princess-sleep` ↔ dir `sleep-princess`).
  publicDir?: string;

  // Whether this volume ships a heavy `manifest.json` (cover / gallery /
  // poetry / illustrations). Defaults to `true`. Set `false` for text-only
  // volumes so `getHeavy()` skips the fetch entirely instead of probing a
  // file that doesn't exist and logging a 404 on every volume-page load.
  hasManifest?: boolean;

  chapter: VolumeChapter[];
  afterword?: VolumeChapter;
};

export type VolumeHeavy = {
  subtitle?: string;

  cover: ImageAsset;
  titlePage?: TitlePage;
  openingPoetry?: Poetry;
  openingGallery?: ArtworkPage[];
  closingGallery?: ArtworkPage[];

  description?: string;
  publishedYear?: number;
  isbn?: string;
  translation?: Translation;

  chapterIllustration: Record<string, ImageAsset>;
};

// Slim catalog shapes — minimal metadata used by the library / series cards
// / chapter list, with no chapter content. Co-located here so the library
// catalog can be derived from each volume manifest in one place.
export type SlimChapter = {
  id: string;
  number: number;
  title: string;
  pageCount: number;
  kind?: "afterword";
};

export type SlimVolume = {
  id: string;
  number: number;
  title: string;
  // Carried into slim so synchronous catalogs (e.g. site-wide search) can
  // match Japanese / romanized volume titles without `meta()` resolution.
  originalTitle?: string;
  romanizedTitle?: string;
  sin: Sin | null;
  chapters: SlimChapter[];
};

function slimChapter(c: VolumeChapter, kind?: "afterword"): SlimChapter {
  // `pageCount` is a getter so slim derivation can run at module-load time —
  // before `loadChapterManifest()` resolves — without baking in an empty
  // count. Each access reads the current in-memory manifest.
  return {
    id: c.id,
    number: c.number,
    title: c.title,
    get pageCount() {
      return pageCountUnder(c.pages);
    },
    ...(kind ? { kind } : {}),
  };
}

function deriveSlim(s: VolumeSlim): SlimVolume {
  return {
    id: s.id,
    number: s.number,
    title: s.title,
    ...(s.originalTitle ? { originalTitle: s.originalTitle } : {}),
    ...(s.romanizedTitle ? { romanizedTitle: s.romanizedTitle } : {}),
    sin: s.sin,
    chapters: [
      ...s.chapter.map((c) => slimChapter(c)),
      ...(s.afterword ? [slimChapter(s.afterword, "afterword")] : []),
    ],
  };
}

// Volume detail / hero metadata — every Volume field except resolved chapter
// content. `chapters` and `afterword` carry the slim chapter list (id /
// number / title / pageCount / kind) so the chapter list and adjacency math
// keep working without fetching any `.md` content.
export type VolumeMeta = {
  id: string;
  slug: string;
  number: number;

  title: string;
  originalTitle?: string;
  romanizedTitle?: string;
  subtitle?: string;

  sin: Sin | null;
  series: string;

  cover: ImageAsset;
  titlePage?: TitlePage;
  openingPoetry?: Poetry;
  openingGallery?: ArtworkPage[];
  closingGallery?: ArtworkPage[];

  chapters: SlimChapter[];
  afterword?: SlimChapter;

  description?: string;
  publishedYear?: number;
  isbn?: string;
  translation?: Translation;
};

function deriveMeta(s: VolumeSlim, h: VolumeHeavy): VolumeMeta {
  // `chapterIllustration` is reader-only and not part of `VolumeMeta`.
  const { chapterIllustration: _ill, ...heavyForMeta } = h;
  return {
    id: s.id,
    slug: s.slug,
    number: s.number,
    title: s.title,
    ...(s.originalTitle ? { originalTitle: s.originalTitle } : {}),
    ...(s.romanizedTitle ? { romanizedTitle: s.romanizedTitle } : {}),
    sin: s.sin,
    series: s.series,
    ...heavyForMeta,
    chapters: s.chapter.map((c) => slimChapter(c)),
    ...(s.afterword ? { afterword: slimChapter(s.afterword, "afterword") } : {}),
  };
}

async function deriveChapter(
  s: VolumeSlim,
  illustrations: Record<string, ImageAsset>,
  chapterId: string,
): Promise<ChapterType> {
  const target =
    s.chapter.find((c) => c.id === chapterId) ??
    (s.afterword?.id === chapterId ? s.afterword : undefined);
  if (!target) throw new Error(`Unknown chapter "${chapterId}" in volume "${s.id}"`);
  return Chapter({ ...target, illustrations });
}

export type VolumeBundle = {
  /** Sync slim metadata for catalogs (library, series page, chapter list). */
  slim: SlimVolume;
  /**
   * Async volume metadata for the volume detail page — hero, poetry, gallery,
   * title page, plus the slim chapter list. Lazy-fetches the heavy manifest
   * from `public/novels/<publicDir>/manifest.json` and memoizes the result.
   * Resolves to `undefined` for text-only volumes, which ship no manifest.
   */
  meta: () => Promise<VolumeMeta | undefined>;
  /** Lazy async resolver for one chapter's pages — single chapter's worth of fetches. */
  chapter: (chapterId: string) => Promise<ChapterType>;
  /**
   * Static URLs for offline pre-fetch into the `sf-chapters` SWR cache —
   * the volume's heavy `manifest.json` plus every chapter `.md` file in
   * reading order. The manifest is bundled with the chapter list so the
   * offline reader can resolve cover / gallery / illustration paths
   * without network access. Sync — paths come from slim.
   */
  chapterUrls: () => string[];
  /**
   * Cover, gallery (opening + closing), and chapter-illustration image
   * URLs — everything `<img>` rendering needs offline. Resolved via
   * `asset()` so the URLs match exactly what the browser requests when
   * the corresponding `<img>` mounts. Async because the heavy manifest is
   * lazy-fetched.
   */
  imageUrls: () => Promise<string[]>;
};

function heavyManifestUrl(slim: VolumeSlim): string {
  return `${import.meta.env.BASE_URL}${NOVELS_PREFIX}${slim.publicDir ?? slim.slug}/manifest.json`;
}

/**
 * Volume factory — single source of truth for one volume. Returns a bundle
 * with three views derived from the slim TS object plus a lazily-fetched
 * heavy manifest from `public/novels/<publicDir>/manifest.json`:
 *
 *  - `slim` (sync) for catalogs that only need metadata + page-counts.
 *  - `meta()` (async) for the volume detail page — hero / poetry / gallery /
 *    title-page metadata plus the slim chapter list.
 *  - `chapter(id)` (async) for the page reader — fetches one chapter's pages.
 *
 * Routes consume the same bundle, so titles, ids, sin, page-counts can't drift.
 */
export function Volume(slim: VolumeSlim): VolumeBundle {
  let cachedHeavy: Promise<VolumeHeavy | null> | undefined;
  function getHeavy(): Promise<VolumeHeavy | null> {
    cachedHeavy ??= (async () => {
      // Text-only volumes ship no manifest by design. Return `null` without a
      // network round-trip so we don't probe (and 404 on) a file we know
      // isn't there. Callers treat `null` as "no heavy metadata" and fall back.
      if (slim.hasManifest === false) return null;
      const url = heavyManifestUrl(slim);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
      return (await res.json()) as VolumeHeavy;
    })();
    return cachedHeavy;
  }

  return {
    slim: deriveSlim(slim),
    meta: async () => {
      const heavy = await getHeavy();
      return heavy ? deriveMeta(slim, heavy) : undefined;
    },
    chapter: async (chapterId) => {
      // Prose-only chapters reference no illustrations. `getHeavy()` returns
      // `null` for text-only volumes; the `catch` only guards a genuine
      // manifest fetch failure on a volume that does declare one.
      let illustrations: Record<string, ImageAsset> = {};
      try {
        illustrations = (await getHeavy())?.chapterIllustration ?? {};
      } catch {
        illustrations = {};
      }
      return deriveChapter(slim, illustrations, chapterId);
    },
    chapterUrls: () => {
      const md = slim.chapter.flatMap((c) => urlsUnder(c.pages));
      const all = slim.afterword ? [...md, ...urlsUnder(slim.afterword.pages)] : md;
      // Text-only volumes have no manifest to pre-cache. Otherwise list the
      // heavy manifest first so an offline reader has it in cache before any
      // page render that depends on it (cover / illustration paths).
      return slim.hasManifest === false ? all : [heavyManifestUrl(slim), ...all];
    },
    imageUrls: async () => {
      const heavy = await getHeavy();
      // Text-only volumes have no images to pre-cache.
      if (!heavy) return [];
      // Set-deduped: chapterIllustration entries can be referenced by
      // multiple chapters but the underlying URL only needs caching once.
      const urls = new Set<string>();
      urls.add(asset(heavy.cover.src));
      for (const a of heavy.openingGallery ?? []) urls.add(asset(a.illustration.src));
      for (const a of heavy.closingGallery ?? []) urls.add(asset(a.illustration.src));
      for (const ill of Object.values(heavy.chapterIllustration)) {
        urls.add(asset(ill.src));
      }
      return Array.from(urls);
    },
  };
}
