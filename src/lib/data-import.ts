import { db } from "./db";
import type { ExportBundle } from "./data-export";

/**
 * Parse + validate an exported bundle. Strict on the wrapper (schema /
 * version / shape) but lenient inside the arrays — individual malformed
 * rows are dropped on apply rather than rejecting the whole import.
 */
export type ParseResult = { ok: true; bundle: ExportBundle } | { ok: false; error: string };

export function parseImportBundle(text: string): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Paste an exported snapshot first." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "Not valid JSON." };
  }
  if (!isRecord(parsed)) return { ok: false, error: "Snapshot must be a JSON object." };
  if (parsed.schema !== "story-forge-export") {
    return { ok: false, error: "Snapshot is from a different app." };
  }
  if (parsed.version !== 1) {
    return { ok: false, error: `Unsupported snapshot version: ${String(parsed.version)}` };
  }
  if (!isRecord(parsed.data)) return { ok: false, error: "Snapshot is missing its data block." };

  // The wrapper passes; downcast to ExportBundle for the apply step. Each
  // row is re-validated before insert, so a partially-malformed payload
  // will still import the rows it can.
  return { ok: true, bundle: parsed as unknown as ExportBundle };
}

export type ImportSummary = {
  progress: { added: number; updated: number; skipped: number };
  bookmarks: { added: number; updated: number; skipped: number };
  notes: { added: number; updated: number; skipped: number };
  reactions: { added: number; updated: number; skipped: number };
  readerSettingsApplied: boolean;
};

const READER_SETTINGS_KEY = "story-forge-reader-settings";

/**
 * Merge an import bundle into the local DB with "newest wins" on collisions.
 * Idempotent: re-running with the same bundle leaves the DB unchanged.
 */
export async function applyImportBundle(bundle: ExportBundle): Promise<ImportSummary> {
  const summary: ImportSummary = {
    progress: { added: 0, updated: 0, skipped: 0 },
    bookmarks: { added: 0, updated: 0, skipped: 0 },
    notes: { added: 0, updated: 0, skipped: 0 },
    reactions: { added: 0, updated: 0, skipped: 0 },
    readerSettingsApplied: false,
  };

  await db.transaction(
    "rw",
    [db.chapterProgress, db.bookmarks, db.notes, db.reactions],
    async () => {
      // chapterProgress — keyed on chapterId. Newest `lastReadAt` wins.
      for (const row of bundle.data.chapterProgress ?? []) {
        if (typeof row?.chapterId !== "string") {
          summary.progress.skipped += 1;
          continue;
        }
        const existing = await db.chapterProgress.get(row.chapterId);
        if (!existing) {
          await db.chapterProgress.put({
            chapterId: row.chapterId,
            pagesRead: numberOr(row.pagesRead, 0),
            totalPages: numberOr(row.totalPages, 0),
            lastReadAt: numberOr(row.lastReadAt, Date.now()),
          });
          summary.progress.added += 1;
        } else if (numberOr(row.lastReadAt, 0) > existing.lastReadAt) {
          await db.chapterProgress.put({
            chapterId: row.chapterId,
            pagesRead: numberOr(row.pagesRead, existing.pagesRead),
            totalPages: numberOr(row.totalPages, existing.totalPages),
            lastReadAt: numberOr(row.lastReadAt, existing.lastReadAt),
          });
          summary.progress.updated += 1;
        } else {
          summary.progress.skipped += 1;
        }
      }

      // bookmarks — natural key is [chapterId+pageNumber]. Latest createdAt
      // wins; the label can update.
      for (const row of bundle.data.bookmarks ?? []) {
        if (
          typeof row?.chapterId !== "string" ||
          typeof row?.pageNumber !== "number" ||
          typeof row?.seriesId !== "string" ||
          typeof row?.volumeId !== "string"
        ) {
          summary.bookmarks.skipped += 1;
          continue;
        }
        const existing = await db.bookmarks
          .where("[chapterId+pageNumber]")
          .equals([row.chapterId, row.pageNumber])
          .first();
        if (!existing) {
          await db.bookmarks.add({
            seriesId: row.seriesId,
            volumeId: row.volumeId,
            chapterId: row.chapterId,
            pageNumber: row.pageNumber,
            ...(row.label ? { label: row.label } : {}),
            createdAt: numberOr(row.createdAt, Date.now()),
          });
          summary.bookmarks.added += 1;
        } else if (numberOr(row.createdAt, 0) > existing.createdAt) {
          await db.bookmarks.update(existing.id!, {
            seriesId: row.seriesId,
            volumeId: row.volumeId,
            label: row.label,
            createdAt: numberOr(row.createdAt, existing.createdAt),
          });
          summary.bookmarks.updated += 1;
        } else {
          summary.bookmarks.skipped += 1;
        }
      }

      // notes — natural key is [chapterId+pageNumber]. Latest updatedAt
      // wins; older note bodies are preserved if the import is older.
      for (const row of bundle.data.notes ?? []) {
        if (
          typeof row?.chapterId !== "string" ||
          typeof row?.pageNumber !== "number" ||
          typeof row?.body !== "string" ||
          typeof row?.seriesId !== "string" ||
          typeof row?.volumeId !== "string"
        ) {
          summary.notes.skipped += 1;
          continue;
        }
        const existing = await db.notes
          .where("[chapterId+pageNumber]")
          .equals([row.chapterId, row.pageNumber])
          .first();
        if (!existing) {
          await db.notes.add({
            seriesId: row.seriesId,
            volumeId: row.volumeId,
            chapterId: row.chapterId,
            pageNumber: row.pageNumber,
            body: row.body,
            createdAt: numberOr(row.createdAt, Date.now()),
            updatedAt: numberOr(row.updatedAt, Date.now()),
          });
          summary.notes.added += 1;
        } else if (numberOr(row.updatedAt, 0) > existing.updatedAt) {
          await db.notes.update(existing.id!, {
            body: row.body,
            updatedAt: numberOr(row.updatedAt, existing.updatedAt),
          });
          summary.notes.updated += 1;
        } else {
          summary.notes.skipped += 1;
        }
      }

      // reactions — natural key is [targetType+targetId+kind]. Presence
      // alone is the state, so the row is either added or skipped.
      for (const row of bundle.data.reactions ?? []) {
        if (
          (row?.targetType !== "series" &&
            row?.targetType !== "song" &&
            row?.targetType !== "character") ||
          typeof row?.targetId !== "string" ||
          row?.kind !== "like"
        ) {
          summary.reactions.skipped += 1;
          continue;
        }
        const existing = await db.reactions
          .where("[targetType+targetId+kind]")
          .equals([row.targetType, row.targetId, row.kind])
          .first();
        if (!existing) {
          await db.reactions.add({
            targetType: row.targetType,
            targetId: row.targetId,
            kind: row.kind,
            createdAt: numberOr(row.createdAt, Date.now()),
          });
          summary.reactions.added += 1;
        } else {
          summary.reactions.skipped += 1;
        }
      }
    },
  );

  // Reader settings — if the bundle carries a value, write it back. The
  // provider reads from localStorage at construction; the user will see
  // the new values after a refresh, which the dialog tells them.
  if (bundle.data.readerSettings != null && isRecord(bundle.data.readerSettings)) {
    try {
      window.localStorage.setItem(READER_SETTINGS_KEY, JSON.stringify(bundle.data.readerSettings));
      summary.readerSettingsApplied = true;
    } catch {
      // Quota / private mode — leave readerSettingsApplied false.
    }
  }

  return summary;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function numberOr(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
