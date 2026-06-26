import { Link } from "@src/components/primitives/link";
import { BookmarkSimpleIcon, DotsThreeVerticalIcon, NotebookIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { Badge } from "@src/components/primitives/badge";
import { IconButton } from "@src/components/primitives/icon-button";
import { Menu } from "@src/components/primitives/menu";
import { isVolumeAvailable } from "@app/library/-volumes";
import { useAllBookmarks } from "@src/lib/bookmarks";
import { useAllNotes } from "@src/lib/notes";
import { markChapterComplete, resetChapterProgress, useChapterPagesRead } from "@src/lib/progress";
import type { Chapter } from "@src/routes/_app/library/-library";

type Props = {
  seriesId: string;
  volumeId: string;
  chapters: Chapter[];
};

export function ChapterList({ seriesId, volumeId, chapters }: Props) {
  const available = isVolumeAvailable(volumeId);

  // One Dexie query per kind for the whole list, then group counts by chapterId.
  // This avoids N+1 reactive subscriptions across the chapter rows.
  const bookmarks = useAllBookmarks();
  const notes = useAllNotes();
  const counts = useMemo(() => {
    const out = new Map<string, { bookmarks: number; notes: number }>();
    for (const b of bookmarks) {
      if (b.volumeId !== volumeId) continue;
      const slot = out.get(b.chapterId) ?? { bookmarks: 0, notes: 0 };
      slot.bookmarks += 1;
      out.set(b.chapterId, slot);
    }
    for (const n of notes) {
      if (n.volumeId !== volumeId) continue;
      const slot = out.get(n.chapterId) ?? { bookmarks: 0, notes: 0 };
      slot.notes += 1;
      out.set(n.chapterId, slot);
    }
    return out;
  }, [bookmarks, notes, volumeId]);

  return (
    <ul className="flex flex-col">
      {chapters.map((c) => (
        <ChapterRow
          key={c.id}
          seriesId={seriesId}
          volumeId={volumeId}
          chapter={c}
          disabled={!available}
          bookmarkCount={counts.get(c.id)?.bookmarks ?? 0}
          noteCount={counts.get(c.id)?.notes ?? 0}
        />
      ))}
    </ul>
  );
}

function ChapterRow({
  seriesId,
  volumeId,
  chapter,
  disabled,
  bookmarkCount,
  noteCount,
}: {
  seriesId: string;
  volumeId: string;
  chapter: Chapter;
  disabled: boolean;
  bookmarkCount: number;
  noteCount: number;
}) {
  const pagesRead = useChapterPagesRead(chapter.id, chapter.pageCount);

  const rowContent = (
    <>
      {chapter.kind === "afterword" ? (
        <span className="w-8" aria-hidden />
      ) : (
        <span className="w-8 text-right text-style-caption text-fg-muted tabular-nums">
          {chapter.number}
        </span>
      )}
      <span className="flex-1 text-style-body text-fg">{chapter.title}</span>
      {bookmarkCount > 0 || noteCount > 0 ? (
        <span className="hidden items-center gap-1 sm:inline-flex">
          {bookmarkCount > 0 ? (
            <Badge
              variant="outline"
              size="sm"
              icon={<BookmarkSimpleIcon weight="light" />}
              aria-label={`${bookmarkCount} bookmark${bookmarkCount !== 1 ? "s" : ""}`}
            >
              {bookmarkCount}
            </Badge>
          ) : null}
          {noteCount > 0 ? (
            <Badge
              variant="outline"
              size="sm"
              icon={<NotebookIcon weight="light" />}
              aria-label={`${noteCount} note${noteCount !== 1 ? "s" : ""}`}
            >
              {noteCount}
            </Badge>
          ) : null}
        </span>
      ) : null}
      <span className="hidden text-style-caption text-fg-muted sm:inline">
        {chapter.pageCount} pages
      </span>
      {disabled ? (
        <Badge variant="outline" size="sm">
          Pending
        </Badge>
      ) : (
        <ChapterStatus pagesRead={pagesRead} pageCount={chapter.pageCount} />
      )}
    </>
  );

  return (
    <li className="flex items-center gap-1 border-t border-border">
      {disabled ? (
        <div
          aria-disabled="true"
          className="flex flex-1 cursor-not-allowed items-center gap-4 px-3 py-4 opacity-50"
        >
          {rowContent}
        </div>
      ) : (
        <>
          <Link
            to="/library/$seriesId/$volumeId/$chapterId"
            params={{ seriesId, volumeId, chapterId: chapter.id }}
            className="flex flex-1 items-center gap-4 px-3 py-4 transition-colors hover:bg-accent-soft"
          >
            {rowContent}
          </Link>
          <ChapterRowMenu chapter={chapter} pagesRead={pagesRead} />
        </>
      )}
    </li>
  );
}

function ChapterRowMenu({ chapter, pagesRead }: { chapter: Chapter; pagesRead: number }) {
  return (
    <Menu>
      <Menu.Trigger
        render={
          <IconButton size="sm" variant="ghost" aria-label={`Actions for ${chapter.title}`}>
            <DotsThreeVerticalIcon weight="bold" />
          </IconButton>
        }
      />
      <Menu.Portal>
        <Menu.Positioner align="end">
          <Menu.Popup>
            <Menu.Item
              disabled={pagesRead >= chapter.pageCount}
              onClick={() => void markChapterComplete(chapter.id, chapter.pageCount)}
            >
              Mark complete
            </Menu.Item>
            <Menu.Item
              disabled={pagesRead === 0}
              onClick={() => void resetChapterProgress(chapter.id)}
            >
              Reset progress
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu>
  );
}

function ChapterStatus({ pagesRead, pageCount }: { pagesRead: number; pageCount: number }) {
  if (pagesRead >= pageCount && pageCount > 0) {
    return (
      <Badge variant="soft" size="sm">
        Read
      </Badge>
    );
  }
  if (pagesRead > 0) {
    return (
      <Badge variant="solid" size="sm" className="tabular-nums">
        {pagesRead}/{pageCount}
      </Badge>
    );
  }
  return <span className="w-10" />;
}
