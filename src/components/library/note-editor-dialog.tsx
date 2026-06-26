import { useEffect, useRef, useState } from "react";
import { Dialog } from "@src/components/primitives/dialog";
import { Button } from "@src/components/primitives/button";
import { upsertNote, useNote } from "@src/lib/notes";

type Props = {
  seriesId: string;
  volumeId: string;
  chapterId: string;
  pageNumber: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NoteEditorDialog({
  seriesId,
  volumeId,
  chapterId,
  pageNumber,
  open,
  onOpenChange,
}: Props) {
  const note = useNote(chapterId, pageNumber);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Re-seed the draft each time the dialog opens — picking up any existing
  // note body or starting blank.
  useEffect(() => {
    if (open) setDraft(note?.body ?? "");
  }, [open, note?.body]);

  useEffect(() => {
    if (open) {
      // base-ui handles focus trap; explicitly focus the textarea after mount.
      const t = setTimeout(() => textareaRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  const save = () => {
    void upsertNote({ seriesId, volumeId, chapterId, pageNumber }, draft);
    onOpenChange(false);
  };

  const cancel = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <Dialog.Title>Note · Page {pageNumber}</Dialog.Title>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                save();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            placeholder="Write a note for this page…"
            rows={6}
            className="mt-4 w-full font-serif text-style-body bg-surface text-fg placeholder:text-fg-muted border border-border rounded-sm p-3 resize-y focus:outline-none focus:border-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          />
          <div className="mt-1 text-style-caption text-fg-muted">
            <kbd>⌘/Ctrl</kbd> + <kbd>Enter</kbd> to save · <kbd>Esc</kbd> to cancel · empty saves to
            delete
          </div>
          <div className="mt-5 flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={cancel}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={save}>
              Save
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog>
  );
}
