import { useState } from "react";
import { Link } from "@src/components/primitives/link";
import { NotePencilIcon, PencilSimpleIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { Drawer } from "@src/components/primitives/drawer";
import { IconButton } from "@src/components/primitives/icon-button";
import { ScrollArea } from "@src/components/primitives/scroll-area";
import { useAllNotes, removeNote } from "@src/lib/notes";
import { series as seriesList } from "@src/routes/_app/library/-library";
import { NoteEditorDialog } from "./note-editor-dialog";
import type { Note } from "@src/lib/db";

export function NotesDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [editing, setEditing] = useState<Note | null>(null);
  const notes = useAllNotes();

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Popup side="right" className="gap-0 p-0">
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <Drawer.Title>Notes</Drawer.Title>
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="Close notes"
                onClick={() => onOpenChange(false)}
              >
                <XIcon weight="light" />
              </IconButton>
            </header>

            {notes.length === 0 ? (
              <p className="px-6 py-6 text-style-body text-fg-muted italic">
                No notes yet. Tap the note icon on any page to write one.
              </p>
            ) : (
              <ScrollArea className="flex-1">
                <ul className="flex flex-col px-6 py-2">
                  {notes.map((n) => (
                    <NoteRow
                      key={n.id}
                      note={n}
                      onNavigate={() => onOpenChange(false)}
                      onEdit={() => setEditing(n)}
                    />
                  ))}
                </ul>
              </ScrollArea>
            )}
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer>

      {editing ? (
        <NoteEditorDialog
          seriesId={editing.seriesId}
          volumeId={editing.volumeId}
          chapterId={editing.chapterId}
          pageNumber={editing.pageNumber}
          open={editing !== null}
          onOpenChange={(o) => {
            if (!o) setEditing(null);
          }}
        />
      ) : null}
    </>
  );
}

function NoteRow({
  note,
  onNavigate,
  onEdit,
}: {
  note: Note;
  onNavigate: () => void;
  onEdit: () => void;
}) {
  const s = seriesList.find((x) => x.id === note.seriesId);
  const v = s?.volumes.find((x) => x.id === note.volumeId);
  const c = v?.chapters.find((x) => x.id === note.chapterId);

  return (
    <li className="flex items-start gap-3 border-b border-border last:border-b-0 py-3">
      <NotePencilIcon weight="fill" className="mt-1.5 text-accent shrink-0" size={16} />
      <Link
        to="/library/$seriesId/$volumeId/$chapterId/$pageNumber"
        params={{
          seriesId: note.seriesId,
          volumeId: note.volumeId,
          chapterId: note.chapterId,
          pageNumber: String(note.pageNumber),
        }}
        onClick={onNavigate}
        className="flex-1 flex flex-col gap-0.5 min-w-0 text-left rounded-sm hover:bg-accent-soft -mx-2 px-2 py-1 transition-colors"
      >
        <span className="text-style-body text-fg line-clamp-2 whitespace-pre-line">
          {note.body}
        </span>
        <span className="text-style-caption text-fg-muted line-clamp-1">
          {c?.title ?? note.chapterId} · Page {note.pageNumber}
        </span>
      </Link>
      <IconButton size="sm" variant="ghost" aria-label="Edit note" onClick={onEdit}>
        <PencilSimpleIcon weight="light" />
      </IconButton>
      <IconButton
        size="sm"
        variant="ghost"
        aria-label="Delete note"
        onClick={() => {
          if (note.id != null) void removeNote(note.id);
        }}
      >
        <TrashIcon weight="light" />
      </IconButton>
    </li>
  );
}
