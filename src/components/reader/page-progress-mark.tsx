import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookmarkSimpleIcon, NotePencilIcon } from "@phosphor-icons/react";
import { bumpChapterProgress } from "@src/lib/progress";
import { toggleBookmark, useBookmark } from "@src/lib/bookmarks";
import { useNote } from "@src/lib/notes";
import { IconButton } from "@src/components/primitives/icon-button";
import { NoteEditorDialog } from "@src/components/library/note-editor-dialog";

type Props = {
  seriesId: string;
  volumeId: string;
  chapterId: string;
  pageIndex: number;
  pageNumber: number;
  totalPages: number;
  children: ReactNode;
};

/*
 * Wraps a single rendered page. Three responsibilities:
 *   1. Bumps reading progress when the page scrolls into the upper half of
 *      the viewport (one-shot per mount).
 *   2. Renders bookmark + note toggles and a `#page-{n}` anchor for deep-links
 *      from the bookmarks/notes drawers.
 *   3. Hosts the per-page note editor dialog.
 */
export function PageProgressMark({
  seriesId,
  volumeId,
  chapterId,
  pageIndex,
  pageNumber,
  totalPages,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const bookmark = useBookmark(chapterId, pageNumber);
  const note = useNote(chapterId, pageNumber);
  const bookmarked = !!bookmark;
  const hasNote = !!note;
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void bumpChapterProgress(chapterId, pageIndex + 1, totalPages);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -50% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [chapterId, pageIndex, totalPages]);

  return (
    <div ref={ref} id={`page-${pageNumber}`} className="relative scroll-mt-20">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5">
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
            void toggleBookmark({ seriesId, volumeId, chapterId, pageNumber });
          }}
        >
          <BookmarkSimpleIcon weight={bookmarked ? "fill" : "light"} />
        </IconButton>
      </div>
      {children}
      <NoteEditorDialog
        seriesId={seriesId}
        volumeId={volumeId}
        chapterId={chapterId}
        pageNumber={pageNumber}
        open={editorOpen}
        onOpenChange={setEditorOpen}
      />
    </div>
  );
}
