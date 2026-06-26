import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { series } from "@src/routes/_app/library/-library";
import { db } from "@src/lib/db";

/*
 * Chapter root — resolves the chapter's resume page (last page the reader
 * touched, or page 1 if none) and redirects to it. Kept as a separate index
 * route so links to /library/.../$chapterId resolve cleanly.
 *
 * Reads only the slim chapter list; we don't need the chapter's actual page
 * content to compute the redirect target since page numbers are 1..pageCount.
 */
export const Route = createFileRoute("/_app/library/$seriesId/$volumeId/$chapterId/")({
  loader: async ({ params }) => {
    const s = series.find((x) => x.id === params.seriesId);
    if (!s) throw notFound();
    const slim = s.volumes.find((x) => x.id === params.volumeId);
    if (!slim) throw notFound();
    const chapter = slim.chapters.find((c) => c.id === params.chapterId);
    if (!chapter) throw notFound();
    if (chapter.pageCount === 0) {
      // Empty chapter — fall back to the volume detail page.
      throw redirect({
        to: "/library/$seriesId/$volumeId",
        params: { seriesId: params.seriesId, volumeId: params.volumeId },
      });
    }

    // Resume target: last page the user reached. `pagesRead` is 1-based and,
    // for current data, matches the page-number index. Clamp into range and
    // fall back to the first page when there's no record yet.
    const record = await db.chapterProgress.get(params.chapterId);
    const pagesRead = record?.pagesRead ?? 0;
    const targetNumber = pagesRead > 0 ? Math.min(pagesRead, chapter.pageCount) : 1;

    throw redirect({
      to: "/library/$seriesId/$volumeId/$chapterId/$pageNumber",
      params: {
        seriesId: params.seriesId,
        volumeId: params.volumeId,
        chapterId: params.chapterId,
        pageNumber: String(targetNumber),
      },
    });
  },
});
