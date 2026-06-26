import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type ChapterProgress } from "./db";
import { series } from "@src/routes/_app/library/-library";
import type { Chapter, Sin, Series, Volume } from "@src/routes/_app/library/-library";

type SlimChapter = { id: string; pageCount: number };

// Reverse index built once at module load: chapterId → its enclosing series/volume/chapter.
// Used by `useInProgressVolumes` to resolve raw progress records back into volumes.
const chapterIndex: Map<string, { series: Series; volume: Volume; chapter: Chapter }> = (() => {
  const m = new Map<string, { series: Series; volume: Volume; chapter: Chapter }>();
  for (const s of series) {
    for (const v of s.volumes) {
      for (const c of v.chapters) {
        m.set(c.id, { series: s, volume: v, chapter: c });
      }
    }
  }
  return m;
})();

export function useChapterPercent(chapterId: string, pageCount: number): number {
  const record = useLiveQuery(() => db.chapterProgress.get(chapterId), [chapterId]);
  const pagesRead = Math.min(record?.pagesRead ?? 0, pageCount);
  return pageCount ? Math.round((pagesRead / pageCount) * 100) : 0;
}

export function useChapterPagesRead(chapterId: string, pageCount: number): number {
  const record = useLiveQuery(() => db.chapterProgress.get(chapterId), [chapterId]);
  return Math.min(record?.pagesRead ?? 0, pageCount);
}

export function useVolumeProgress(chapters: SlimChapter[]): {
  pagesRead: number;
  totalPages: number;
  percent: number;
} {
  const ids = chapters.map((c) => c.id);
  const records =
    useLiveQuery(
      () => db.chapterProgress.where("chapterId").anyOf(ids).toArray(),
      [ids.join("|")],
    ) ?? [];

  const byId = new Map(records.map((r) => [r.chapterId, r] as const));
  const totalPages = chapters.reduce((sum, c) => sum + c.pageCount, 0);
  const pagesRead = chapters.reduce((sum, c) => {
    const r = byId.get(c.id);
    return sum + Math.min(r?.pagesRead ?? 0, c.pageCount);
  }, 0);

  return {
    pagesRead,
    totalPages,
    percent: totalPages ? Math.round((pagesRead / totalPages) * 100) : 0,
  };
}

export async function bumpChapterProgress(
  chapterId: string,
  pagesRead: number,
  totalPages: number,
): Promise<void> {
  // Transaction prevents lost updates when multiple page observers fire near-simultaneously.
  await db.transaction("rw", db.chapterProgress, async () => {
    const existing = await db.chapterProgress.get(chapterId);
    if ((existing?.pagesRead ?? 0) >= pagesRead) return;
    await db.chapterProgress.put({
      chapterId,
      pagesRead,
      totalPages,
      lastReadAt: Date.now(),
    });
  });
}

export async function markChapterComplete(chapterId: string, totalPages: number): Promise<void> {
  await db.chapterProgress.put({
    chapterId,
    pagesRead: totalPages,
    totalPages,
    lastReadAt: Date.now(),
  });
}

export async function resetChapterProgress(chapterId: string): Promise<void> {
  await db.chapterProgress.delete(chapterId);
}

export async function markVolumeComplete(chapters: SlimChapter[]): Promise<void> {
  const now = Date.now();
  await db.transaction("rw", db.chapterProgress, async () => {
    for (const c of chapters) {
      await db.chapterProgress.put({
        chapterId: c.id,
        pagesRead: c.pageCount,
        totalPages: c.pageCount,
        lastReadAt: now,
      });
    }
  });
}

export async function resetVolumeProgress(chapterIds: string[]): Promise<void> {
  await db.chapterProgress.bulkDelete(chapterIds);
}

export type VolumeInProgress = {
  seriesId: string;
  volumeId: string;
  seriesTitle: string;
  volumeTitle: string;
  sin: Sin | null;
  totalPages: number;
  pagesRead: number;
  percent: number;
  lastReadAt: number;
  // Chapter ids in the volume — used to wipe progress for the entire volume.
  chapterIds: string[];
  // "Continue reading" deep-link target: most recently read incomplete chapter,
  // or first untouched chapter if everything touched is complete.
  resumeChapterId: string;
  // Page number to deep-link to. Undefined when resuming at chapter top
  // (e.g. an untouched chapter following a marked-complete one).
  resumePageNumber?: number;
};

export function useInProgressVolumes(): VolumeInProgress[] {
  const records = useLiveQuery(() => db.chapterProgress.toArray(), []);

  return useMemo(() => {
    if (!records) return [];

    type Acc = {
      seriesId: string;
      volumeId: string;
      seriesTitle: string;
      volumeTitle: string;
      sin: Sin | null;
      totalPages: number;
      pagesRead: number;
      lastReadAt: number;
      volume: Volume;
      records: ChapterProgress[];
    };
    const byVolume = new Map<string, Acc>();

    for (const r of records) {
      const idx = chapterIndex.get(r.chapterId);
      if (!idx) continue;
      const key = `${idx.series.id}:${idx.volume.id}`;
      const cap = Math.min(r.pagesRead, idx.chapter.pageCount);
      let acc = byVolume.get(key);
      if (!acc) {
        const totalPages = idx.volume.chapters.reduce((sum, c) => sum + c.pageCount, 0);
        acc = {
          seriesId: idx.series.id,
          volumeId: idx.volume.id,
          seriesTitle: idx.series.title,
          volumeTitle: idx.volume.title,
          sin: idx.volume.sin,
          totalPages,
          pagesRead: 0,
          lastReadAt: 0,
          volume: idx.volume,
          records: [],
        };
        byVolume.set(key, acc);
      }
      acc.pagesRead += cap;
      acc.lastReadAt = Math.max(acc.lastReadAt, r.lastReadAt);
      acc.records.push(r);
    }

    const result: VolumeInProgress[] = [];
    for (const v of byVolume.values()) {
      // Filter on raw pages — the rounded percent can collapse a tiny prologue
      // (1/302 pages) to 0% and incorrectly hide the volume.
      if (v.pagesRead <= 0 || v.pagesRead >= v.totalPages) continue;
      const percent = v.totalPages ? Math.round((v.pagesRead / v.totalPages) * 100) : 0;

      const target = pickResumeTarget(v.volume, v.records);
      if (!target) continue;

      result.push({
        seriesId: v.seriesId,
        volumeId: v.volumeId,
        seriesTitle: v.seriesTitle,
        volumeTitle: v.volumeTitle,
        sin: v.sin,
        totalPages: v.totalPages,
        pagesRead: v.pagesRead,
        percent,
        lastReadAt: v.lastReadAt,
        chapterIds: v.volume.chapters.map((c) => c.id),
        resumeChapterId: target.chapterId,
        resumePageNumber: target.pageNumber,
      });
    }
    result.sort((a, b) => b.lastReadAt - a.lastReadAt);
    return result;
  }, [records]);
}

function pickResumeTarget(
  volume: Volume,
  records: ChapterProgress[],
): { chapterId: string; pageNumber?: number } | null {
  // 1. Most recently touched incomplete chapter — resume at the page they reached.
  //    `pagesRead` is a 1-based count of pages reached and (for current data)
  //    matches the data's contiguous 1-based `page.number`, so it doubles as
  //    the deep-link page anchor.
  const sorted = [...records].sort((a, b) => b.lastReadAt - a.lastReadAt);
  for (const r of sorted) {
    const ch = volume.chapters.find((c) => c.id === r.chapterId);
    if (!ch) continue;
    if (r.pagesRead < ch.pageCount) {
      return { chapterId: r.chapterId, pageNumber: r.pagesRead };
    }
  }

  // 2. All touched chapters complete — start the first untouched chapter from the top.
  const touched = new Set(records.map((r) => r.chapterId));
  for (const ch of volume.chapters) {
    if (!touched.has(ch.id)) {
      return { chapterId: ch.id };
    }
  }

  return null;
}
