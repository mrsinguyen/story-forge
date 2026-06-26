import { db } from "./db";

/**
 * User-state export bundle. Captures every Dexie table the app writes to
 * (progress / bookmarks / notes / reactions) plus the reader-settings
 * blob from localStorage. Auto-incremented Dexie ids are intentionally
 * excluded so an import doesn't conflict with rows already in the
 * destination DB — bookmarks/notes/reactions are re-keyed by their
 * natural fields on the way in.
 */
export type ExportBundle = {
  schema: "story-forge-export";
  version: 1;
  exportedAt: number;
  data: {
    chapterProgress: Array<{
      chapterId: string;
      pagesRead: number;
      totalPages: number;
      lastReadAt: number;
    }>;
    bookmarks: Array<{
      seriesId: string;
      volumeId: string;
      chapterId: string;
      pageNumber: number;
      label?: string;
      createdAt: number;
    }>;
    notes: Array<{
      seriesId: string;
      volumeId: string;
      chapterId: string;
      pageNumber: number;
      body: string;
      createdAt: number;
      updatedAt: number;
    }>;
    reactions: Array<{
      targetType: "series" | "song" | "character";
      targetId: string;
      kind: "like";
      createdAt: number;
    }>;
    readerSettings: unknown;
  };
};

const READER_SETTINGS_KEY = "story-forge-reader-settings";

export async function buildExportBundle(): Promise<ExportBundle> {
  const [progress, bookmarks, notes, reactions] = await Promise.all([
    db.chapterProgress.toArray(),
    db.bookmarks.toArray(),
    db.notes.toArray(),
    db.reactions.toArray(),
  ]);

  let readerSettings: unknown = null;
  try {
    const raw = window.localStorage.getItem(READER_SETTINGS_KEY);
    if (raw) readerSettings = JSON.parse(raw);
  } catch {
    // Quota / private mode / malformed JSON — settings stay null.
  }

  return {
    schema: "story-forge-export",
    version: 1,
    exportedAt: Date.now(),
    data: {
      chapterProgress: progress.map(({ chapterId, pagesRead, totalPages, lastReadAt }) => ({
        chapterId,
        pagesRead,
        totalPages,
        lastReadAt,
      })),
      bookmarks: bookmarks.map(({ id: _id, ...rest }) => rest),
      notes: notes.map(({ id: _id, ...rest }) => rest),
      reactions: reactions.map(({ id: _id, ...rest }) => rest),
      readerSettings,
    },
  };
}

export type ExportSummary = {
  progress: number;
  bookmarks: number;
  notes: number;
  reactions: number;
  hasReaderSettings: boolean;
  bytes: number;
};

export function summarize(bundle: ExportBundle, json: string): ExportSummary {
  return {
    progress: bundle.data.chapterProgress.length,
    bookmarks: bundle.data.bookmarks.length,
    notes: bundle.data.notes.length,
    reactions: bundle.data.reactions.length,
    hasReaderSettings: bundle.data.readerSettings != null,
    bytes: new TextEncoder().encode(json).byteLength,
  };
}
