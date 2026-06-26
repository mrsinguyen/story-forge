import { useEffect, useRef, useState } from "react";
import { Link } from "@src/components/primitives/link";
import {
  BookmarkSimpleIcon,
  CheckIcon,
  PencilSimpleIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Drawer } from "@src/components/primitives/drawer";
import { IconButton } from "@src/components/primitives/icon-button";
import { Input } from "@src/components/primitives/input";
import { ScrollArea } from "@src/components/primitives/scroll-area";
import { useAllBookmarks, removeBookmark, setBookmarkLabel } from "@src/lib/bookmarks";
import { series as seriesList } from "@src/routes/_app/library/-library";
import type { Bookmark } from "@src/lib/db";

export function BookmarksDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const bookmarks = useAllBookmarks();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Popup side="right" className="gap-0 p-0">
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <Drawer.Title>Bookmarks</Drawer.Title>
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Close bookmarks"
              onClick={() => onOpenChange(false)}
            >
              <XIcon weight="light" />
            </IconButton>
          </header>

          {bookmarks.length === 0 ? (
            <p className="px-6 py-6 text-style-body text-fg-muted italic">
              No bookmarks yet. Tap the bookmark icon on any page to save it.
            </p>
          ) : (
            <ScrollArea className="flex-1">
              <ul className="flex flex-col px-6 py-2">
                {bookmarks.map((b) => (
                  <BookmarkRow key={b.id} bookmark={b} onNavigate={() => onOpenChange(false)} />
                ))}
              </ul>
            </ScrollArea>
          )}
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer>
  );
}

function BookmarkRow({ bookmark, onNavigate }: { bookmark: Bookmark; onNavigate: () => void }) {
  const s = seriesList.find((x) => x.id === bookmark.seriesId);
  const v = s?.volumes.find((x) => x.id === bookmark.volumeId);
  const c = v?.chapters.find((x) => x.id === bookmark.chapterId);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEdit = () => {
    setDraft(bookmark.label ?? "");
    setEditing(true);
  };

  const save = () => {
    if (bookmark.id != null) void setBookmarkLabel(bookmark.id, draft);
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  const labeled = !!bookmark.label;
  const primary = bookmark.label ?? c?.title ?? bookmark.chapterId;
  const secondary = labeled
    ? `${c?.title ?? bookmark.chapterId} · Page ${bookmark.pageNumber}`
    : `${v?.title ?? bookmark.volumeId} · Page ${bookmark.pageNumber}`;

  return (
    <li className="flex items-start gap-3 border-b border-border last:border-b-0 py-3">
      <BookmarkSimpleIcon weight="fill" className="mt-1.5 text-accent shrink-0" size={16} />

      {editing ? (
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <Input
            ref={inputRef}
            size="sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            placeholder={c?.title ?? "Label"}
            aria-label="Bookmark label"
          />
          <span className="text-style-caption text-fg-muted line-clamp-1">{secondary}</span>
        </div>
      ) : (
        <Link
          to="/library/$seriesId/$volumeId/$chapterId/$pageNumber"
          params={{
            seriesId: bookmark.seriesId,
            volumeId: bookmark.volumeId,
            chapterId: bookmark.chapterId,
            pageNumber: String(bookmark.pageNumber),
          }}
          onClick={onNavigate}
          className="flex-1 flex flex-col gap-0.5 min-w-0 text-left rounded-sm hover:bg-accent-soft -mx-2 px-2 py-1 transition-colors"
        >
          <span
            className={
              labeled
                ? "text-style-body text-fg italic line-clamp-1"
                : "text-style-body text-fg line-clamp-1"
            }
          >
            {primary}
          </span>
          <span className="text-style-caption text-fg-muted line-clamp-1">{secondary}</span>
        </Link>
      )}

      {editing ? (
        <>
          <IconButton size="sm" variant="ghost" aria-label="Save label" onClick={save}>
            <CheckIcon weight="light" />
          </IconButton>
          <IconButton size="sm" variant="ghost" aria-label="Cancel rename" onClick={cancel}>
            <XIcon weight="light" />
          </IconButton>
        </>
      ) : (
        <>
          <IconButton size="sm" variant="ghost" aria-label="Rename bookmark" onClick={startEdit}>
            <PencilSimpleIcon weight="light" />
          </IconButton>
          <IconButton
            size="sm"
            variant="ghost"
            aria-label="Remove bookmark"
            onClick={() => {
              if (bookmark.id != null) void removeBookmark(bookmark.id);
            }}
          >
            <TrashIcon weight="light" />
          </IconButton>
        </>
      )}
    </li>
  );
}
