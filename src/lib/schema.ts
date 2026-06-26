/*
 * Story Forge — content schema.
 *
 * Target shape for real translated content. Fixtures in `library.ts` use a
 * slimmer transitional shape until we wire in real chapters; new content
 * (volumes you actually translate) should conform to this schema.
 *
 * Volume layout:
 *   cover → titlePage (credits, disclaimer)
 *         → openingPoetry (song lyrics as stanzas)
 *         → openingGallery (full-page artwork)
 *         → chapters (prose pages, optionally interrupted by illustration pages)
 *         → closingGallery / afterword (rare)
 */

export type Sin = "pride" | "lust" | "sloth" | "gluttony" | "greed" | "wrath" | "envy" | "origin"; // Eve Moonlit / Original Sin Story — precursor to the seven

// ---------------------------------------------------------------------------
// Visual assets
// ---------------------------------------------------------------------------

export type ImageAsset = {
  src: string; // absolute path under /public or an imported URL
  alt: string;
  caption?: string;
  credit?: string; // illustrator credit ("Cover Illustration by ...")
  width?: number; // for layout reservation; avoids CLS
  height?: number;
};

// ---------------------------------------------------------------------------
// Songs (audio integration with the reader)
// ---------------------------------------------------------------------------

export type LyricLine = {
  time: number; // seconds from start
  line: string;
};

export type Song = {
  id: string;
  title: string;
  originalTitle?: string; // Japanese
  romanizedTitle?: string;

  // At least one source should be set. `audio` is preferred for the in-app
  // audio dock (native <audio> playback); `youtubeUrl` is the fallback when
  // we don't have a local file.
  audio?: string; // path to audio file (mp3/ogg/etc.)
  youtubeUrl?: string; // canonical YouTube URL for the song

  duration?: number; // seconds — omit when the song is catalogued but has no playable source yet

  vocalist?: string;
  composer?: string;
  releaseYear?: number;

  // Plain markdown lyrics for static display (audio player drawer, etc.)
  lyrics?: string;
  // Optional time-aligned lyrics — enables sync highlighting
  syncedLyrics?: LyricLine[];

  cover?: ImageAsset;
};

// ---------------------------------------------------------------------------
// Front matter — title page, credits, disclaimer
// ---------------------------------------------------------------------------

export type CreditEntry = {
  role: string; // "Original Work", "Illustration", "Publisher", "Distributor", etc.
  name: string; // "Akuno_P (mothy)", "Ichika · Yu · Yunomi", etc.
};

export type TitlePage = {
  title: string; // can mirror or extend volume.title (e.g. "Daughter of Evil — Cloture of Yellow")
  subtitle?: string;
  credits: CreditEntry[]; // ordered list shown on the title page
  publisher?: string;
  distributor?: string;
  // Markdown legal/distribution notice ("This is purely for illustrative purposes…").
  disclaimer?: string;
};

// ---------------------------------------------------------------------------
// Poetry — opening song lyrics rendered as stanzas
// ---------------------------------------------------------------------------

export type PoetryStanza = {
  lines: string[];
};

export type Poetry = {
  title: string; // e.g. "Daughter of Evil"
  attribution?: string; // e.g. "Poetry: Akuno_P (mothy)"
  stanzas: PoetryStanza[];
  // If this poetry is the lyrical content of a song in the catalog, link it
  // so the audio player can offer "play the song" alongside reading the text.
  songId?: string;
};

// ---------------------------------------------------------------------------
// Artwork pages — full-page illustrations grouped before/after chapters
// ---------------------------------------------------------------------------

export type ArtworkPage = {
  illustration: ImageAsset;
  caption?: string;
};

// ---------------------------------------------------------------------------
// Pages (the reader unit inside a chapter)
// ---------------------------------------------------------------------------

/**
 * A page is one screenful in the light-novel-style reader.
 * The `layout` discriminator tells the renderer how to compose text + image.
 */
export type Page =
  | {
      number: number;
      layout: "prose";
      text: string; // markdown
      songCue?: string; // song id — pin/highlight this song in the audio dock when this page is reached
    }
  | {
      number: number;
      layout: "illustration"; // full-page art, no body text — for mid-chapter breaks
      illustration: ImageAsset;
      songCue?: string;
    }
  | {
      number: number;
      layout: "spread"; // image + text on the same page
      text: string;
      illustration: ImageAsset;
      songCue?: string;
    };

// ---------------------------------------------------------------------------
// Chapters
// ---------------------------------------------------------------------------

export type Chapter = {
  id: string;
  number: number;
  title: string;
  originalTitle?: string;
  romanizedTitle?: string;

  pages: Page[];

  // Songs that play in or relate to this chapter (drives the chapter's track list).
  // Each id must exist in the parent volume's `songs` catalog.
  songIds?: string[];
};

// ---------------------------------------------------------------------------
// Translation metadata
// ---------------------------------------------------------------------------

export type Translation = {
  language: string; // ISO 639-1, e.g. "en"
  translator?: string; // person/group/site that produced the translation
  url?: string; // canonical URL for the translation (PDF, page, etc.)
  version?: string; // free-form, e.g. "0.2-draft" or semver
  updatedAt?: string; // ISO date
  source?: "personal" | "fan" | "official";
};

// ---------------------------------------------------------------------------
// Volume
// ---------------------------------------------------------------------------

export type Volume = {
  // Identity
  id: string;
  slug: string;
  number: number;

  // Titles
  title: string; // translated
  originalTitle?: string; // Japanese
  romanizedTitle?: string;
  subtitle?: string;

  // Categorization
  sin: Sin | null; // null for Clockwork Lullaby / Original Sin / lore-only volumes
  series: string; // parent series id

  // ----- Volume content (in reading order) -----

  cover: ImageAsset;
  titlePage?: TitlePage;
  openingPoetry?: Poetry;
  openingGallery?: ArtworkPage[];

  chapters: Chapter[];

  closingGallery?: ArtworkPage[];
  afterword?: Chapter;

  // Metadata
  description?: string;
  publishedYear?: number;
  isbn?: string;
  translation?: Translation;
};

// ---------------------------------------------------------------------------
// Series (parent of Volumes)
// ---------------------------------------------------------------------------

export type Series = {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  romanizedTitle?: string;
  description: string;
  cover?: ImageAsset;
  volumes: Volume[];
};

// ---------------------------------------------------------------------------
// Reader page — flat sequence used by the reader to paginate through a volume.
// Front matter and chapter pages get unified here so the reader just walks an
// array of "screens" instead of branching across nested sections.
// ---------------------------------------------------------------------------

export type ReaderPage =
  | { kind: "cover"; volume: Volume }
  | { kind: "title-page"; titlePage: TitlePage }
  | { kind: "poetry"; poetry: Poetry }
  | { kind: "artwork"; artwork: ArtworkPage; section: "opening" | "closing" }
  | { kind: "chapter-page"; chapter: Chapter; page: Page }
  | { kind: "afterword-page"; chapter: Chapter; page: Page };

export function flattenVolume(volume: Volume): ReaderPage[] {
  const out: ReaderPage[] = [];
  out.push({ kind: "cover", volume });
  if (volume.titlePage) out.push({ kind: "title-page", titlePage: volume.titlePage });
  if (volume.openingPoetry) out.push({ kind: "poetry", poetry: volume.openingPoetry });
  for (const artwork of volume.openingGallery ?? []) {
    out.push({ kind: "artwork", artwork, section: "opening" });
  }
  for (const chapter of volume.chapters) {
    for (const page of chapter.pages) {
      out.push({ kind: "chapter-page", chapter, page });
    }
  }
  for (const artwork of volume.closingGallery ?? []) {
    out.push({ kind: "artwork", artwork, section: "closing" });
  }
  if (volume.afterword) {
    for (const page of volume.afterword.pages) {
      out.push({ kind: "afterword-page", chapter: volume.afterword, page });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Helpers (derive from schema, not stored on it)
// ---------------------------------------------------------------------------

export function totalPages(volume: Volume): number {
  return flattenVolume(volume).length;
}

export function chapterPageCount(chapter: Chapter): number {
  return chapter.pages.length;
}
