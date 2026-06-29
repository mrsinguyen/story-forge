import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { Link } from "@src/components/primitives/link";
import { useEffect, useRef, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { animated, useSpring } from "@react-spring/web";
import {
  BookmarkSimpleIcon,
  CaretLeftIcon,
  CaretRightIcon,
  NotePencilIcon,
  WaveformIcon,
} from "@phosphor-icons/react";
import { series } from "@src/routes/_app/library/-library";
import { getVolumeChapter } from "@app/library/-volumes";
import { PageView } from "@src/components/reader/page-view";
import { Button } from "@src/components/primitives/button";
import { IconButton } from "@src/components/primitives/icon-button";
import { NoteEditorDialog } from "@src/components/library/note-editor-dialog";
import { SinGlyph } from "@src/components/thematic/sin-glyph";
import { toggleBookmark, useBookmark } from "@src/lib/bookmarks";
import { useNote } from "@src/lib/notes";
import { bumpChapterProgress } from "@src/lib/progress";
import { readerSettingsCssVars } from "@src/lib/reader-settings-config";
import { useReaderSettings } from "@src/lib/reader-settings";
import { useTextToSpeech } from "@src/lib/tts";

type PageTarget = { chapterId: string; pageNumber: string };

export const Route = createFileRoute("/_app/library/$seriesId/$volumeId/$chapterId/$pageNumber")({
  component: PageReader,
  loader: async ({ params }) => {
    const s = series.find((x) => x.id === params.seriesId);
    if (!s) throw notFound();
    const slim = s.volumes.find((x) => x.id === params.volumeId);
    if (!slim) throw notFound();

    // Only the active chapter's pages are fetched (`getVolumeChapter` pulls one
    // chapter's `.md` files). The volume header and chapter adjacency come from
    // the slim catalog, which always loads — text-only volumes ship no heavy
    // `manifest.json`, so we must not depend on `getVolumeMeta` here (it returns
    // undefined when the manifest is absent). `slim.chapters` already includes
    // the afterword entry (tagged `kind: "afterword"`).
    const chapter = await getVolumeChapter(params.volumeId, params.chapterId);
    if (!chapter) throw notFound();

    const slimChapters = slim.chapters;
    const chapterIdx = slimChapters.findIndex((c) => c.id === params.chapterId);
    if (chapterIdx === -1) throw notFound();

    const pageNum = Number.parseInt(params.pageNumber, 10);
    if (!Number.isFinite(pageNum)) throw notFound();
    const pageIdx = chapter.pages.findIndex((p) => p.number === pageNum);
    if (pageIdx === -1) throw notFound();
    const page = chapter.pages[pageIdx]!;

    // Prev/next are derived from slim page-counts. Page numbers are 1..N
    // contiguous (see `makePagesBuilder`), so a count is sufficient — no
    // reason to fetch the adjacent chapter's content just to build a link.
    const prevSlim = chapterIdx > 0 ? slimChapters[chapterIdx - 1]! : null;
    const nextSlim = chapterIdx < slimChapters.length - 1 ? slimChapters[chapterIdx + 1]! : null;

    const prev: PageTarget | null =
      pageIdx > 0
        ? { chapterId: chapter.id, pageNumber: String(chapter.pages[pageIdx - 1]!.number) }
        : prevSlim && prevSlim.pageCount > 0
          ? { chapterId: prevSlim.id, pageNumber: String(prevSlim.pageCount) }
          : null;

    const next: PageTarget | null =
      pageIdx < chapter.pages.length - 1
        ? { chapterId: chapter.id, pageNumber: String(chapter.pages[pageIdx + 1]!.number) }
        : nextSlim && nextSlim.pageCount > 0
          ? { chapterId: nextSlim.id, pageNumber: "1" }
          : null;

    // Volume header fields the reader needs, all sourced from slim so the
    // reader works with or without a heavy manifest. `afterword` is the slim
    // chapter tagged `kind: "afterword"`, used to label the header.
    const afterword = slimChapters.find((c) => c.kind === "afterword") ?? null;
    const volume = {
      id: slim.id,
      title: slim.title,
      number: slim.number,
      sin: slim.sin,
      afterword,
    };

    return { series: s, volume, chapter, page, pageIdx, prev, next };
  },
});

function PageReader() {
  const { series: s, volume, chapter, page, pageIdx, prev, next } = Route.useLoaderData();
  const isAfterword = chapter.id === volume.afterword?.id;
  const { settings } = useReaderSettings();
  const cssVars = readerSettingsCssVars(settings);
  const totalPages = chapter.pages.length;
  const bookmark = useBookmark(chapter.id, page.number);
  const note = useNote(chapter.id, page.number);
  const bookmarked = !!bookmark;
  const hasNote = !!note;
  const [editorOpen, setEditorOpen] = useState(false);

  // Read-aloud — pulls text from prose / spread layouts. Illustration-only
  // pages have nothing to read, so the button hides itself there.
  const pageText = page.layout === "prose" || page.layout === "spread" ? page.text : "";
  const tts = useTextToSpeech(pageText);
  const speaking = tts.state === "speaking";

  // Touch swipe → animated page turn powered by react-spring. The spring
  // tracks the finger 1:1 while held (`immediate: true`), then settles via
  // physics on release — either back to 0 (spring-back) or off-screen (commit
  // + navigate). At chapter boundaries (`!prev` / `!next`) drag is rubber-
  // banded to a quarter of the travel so the user feels resistance instead
  // of a free slide into nothing.
  const SWIPE_COMMIT_PX = 80;
  const SWIPE_DISMISS_PX = 700;
  const navigate = useNavigate();
  const [{ x }, api] = useSpring(() => ({ x: 0 }));
  const transitioningRef = useRef(false);

  // Reset spring position on every successful page change. The route loader
  // swaps loader data on the same component instance, so without a reset
  // the next page would render at the dismissed-offscreen offset.
  useEffect(() => {
    api.set({ x: 0 });
    transitioningRef.current = false;
  }, [chapter.id, page.number, api]);

  const bindSwipe = useDrag(
    ({ active, movement: [mx], swipe: [swipeX] }) => {
      // Lock out further drags while the commit animation is mid-flight —
      // a follow-up gesture during that window would cancel the navigate.
      if (transitioningRef.current) return;

      const canPrev = !!prev;
      const canNext = !!next;

      if (active) {
        // Rubber-band when there's no target in the requested direction.
        let target = mx;
        if (mx > 0 && !canPrev) target = mx * 0.25;
        else if (mx < 0 && !canNext) target = mx * 0.25;
        void api.start({ x: target, immediate: true });
        return;
      }

      // Pointer up. Decide: commit (spring off + navigate) or spring back.
      const commitNext = (swipeX === -1 || mx < -SWIPE_COMMIT_PX) && canNext;
      const commitPrev = (swipeX === 1 || mx > SWIPE_COMMIT_PX) && canPrev;

      if (commitNext || commitPrev) {
        transitioningRef.current = true;
        const dismissTo = commitNext ? -SWIPE_DISMISS_PX : SWIPE_DISMISS_PX;
        const target: PageTarget = commitNext ? next! : prev!;
        void api.start({
          x: dismissTo,
          immediate: false,
          // A slightly heavier spring than the snap-back so the dismiss
          // feels decisive rather than bouncy.
          config: { tension: 220, friction: 32, clamp: true },
          onRest: () => {
            void navigate({
              to: "/library/$seriesId/$volumeId/$chapterId/$pageNumber",
              params: { seriesId: s.id, volumeId: volume.id, ...target },
            });
          },
        });
      } else {
        // Under threshold — spring back to 0 with a snappier config.
        void api.start({ x: 0, immediate: false, config: { tension: 280, friction: 28 } });
      }
    },
    { axis: "lock", filterTaps: true },
  );

  // Derived animated values — `x.to(...)` runs in react-spring's animation
  // frame loop, so rotation/opacity stay perfectly in sync with translateX
  // without a re-render per frame.
  const rotate = x.to((v) => v * 0.01);
  const opacity = x.to((v) => 1 - Math.min(Math.abs(v) / SWIPE_DISMISS_PX, 0.9));

  // Bump reading progress on every page-mount. `pageIdx + 1` is the 1-based
  // page reached, matching the deep-link page anchor.
  useEffect(() => {
    void bumpChapterProgress(chapter.id, pageIdx + 1, totalPages);
  }, [chapter.id, pageIdx, totalPages]);

  return (
    <animated.div
      {...bindSwipe()}
      data-sin={volume.sin ?? undefined}
      // `touch-action: pan-y` lets vertical scrolling pass through to the
      // browser while still letting use-gesture capture horizontal drags
      // for swipe detection. Without it, iOS Safari pre-empts the gesture
      // and the swipe handler never fires.
      //
      // `x` / `rotate` / `opacity` are react-spring animated values — they
      // update in the animation frame loop without re-rendering React.
      style={{
        ...cssVars,
        touchAction: "pan-y",
        x,
        rotate,
        opacity,
        willChange: "transform, opacity",
      }}
      className="mx-auto max-w-[var(--reader-max-width,42rem)] px-6 pt-12 pb-28 sm:pt-16 sm:pb-32"
    >
      <Link
        to="/library/$seriesId/$volumeId"
        params={{ seriesId: s.id, volumeId: volume.id }}
        className="text-style-eyebrow text-fg-muted hover:text-fg mb-8 inline-flex items-center gap-1 transition-colors"
      >
        <CaretLeftIcon size={14} />
        {volume.title}
      </Link>

      <header className="border-border mb-10 flex flex-col gap-2 border-b pb-6">
        <span className="text-style-eyebrow text-fg-muted inline-flex items-center gap-2">
          {volume.sin ? (
            <SinGlyph sin={volume.sin} size={14} weight="light" className="text-accent" />
          ) : null}
          Volume {volume.number} · {isAfterword ? "Afterword" : `Chapter ${chapter.number}`}
        </span>
        <h1 className="text-style-heading-1 text-fg">{chapter.title}</h1>
        <div className="flex items-center justify-between gap-3">
          <span className="text-style-caption text-fg-muted tabular-nums">
            Page {page.number} of {totalPages}
          </span>
          <div className="flex items-center gap-0.5">
            {pageText && tts.supported ? (
              <IconButton
                size="sm"
                variant="ghost"
                aria-label={speaking ? "Stop reading aloud" : "Read aloud"}
                aria-pressed={speaking}
                onClick={speaking ? tts.stop : tts.play}
              >
                <WaveformIcon weight={speaking ? "fill" : "light"} />
              </IconButton>
            ) : null}
            <IconButton
              size="sm"
              variant="ghost"
              aria-label={hasNote ? "Edit note" : "Add note"}
              aria-pressed={hasNote}
              onClick={() => setEditorOpen(true)}
            >
              <NotePencilIcon weight={hasNote ? "fill" : "light"} />
            </IconButton>
            <IconButton
              size="sm"
              variant="ghost"
              aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
              aria-pressed={bookmarked}
              onClick={() => {
                void toggleBookmark({
                  seriesId: s.id,
                  volumeId: volume.id,
                  chapterId: chapter.id,
                  pageNumber: page.number,
                });
              }}
            >
              <BookmarkSimpleIcon weight={bookmarked ? "fill" : "light"} />
            </IconButton>
          </div>
        </div>
      </header>

      <article>
        <PageView page={page} />
      </article>

      <PageNav seriesId={s.id} volumeId={volume.id} prev={prev} next={next} />

      <NoteEditorDialog
        seriesId={s.id}
        volumeId={volume.id}
        chapterId={chapter.id}
        pageNumber={page.number}
        open={editorOpen}
        onOpenChange={setEditorOpen}
      />
    </animated.div>
  );
}

function PageNav({
  seriesId,
  volumeId,
  prev,
  next,
}: {
  seriesId: string;
  volumeId: string;
  prev: PageTarget | null;
  next: PageTarget | null;
}) {
  return (
    <nav
      aria-label="Page navigation"
      className="border-border mt-12 flex items-center justify-between gap-4 border-t pt-6"
    >
      {prev ? (
        <Button
          variant="ghost"
          className="pl-0"
          render={
            <Link
              to="/library/$seriesId/$volumeId/$chapterId/$pageNumber"
              params={{ seriesId, volumeId, ...prev }}
            />
          }
        >
          <CaretLeftIcon weight="light" />
          Previous
        </Button>
      ) : (
        <span aria-hidden />
      )}
      {next ? (
        <Button
          variant="ghost"
          className="pr-0 text-accent"
          render={
            <Link
              to="/library/$seriesId/$volumeId/$chapterId/$pageNumber"
              params={{ seriesId, volumeId, ...next }}
            />
          }
        >
          Next
          <CaretRightIcon weight="light" />
        </Button>
      ) : (
        <span aria-hidden />
      )}
    </nav>
  );
}
