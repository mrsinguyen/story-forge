import { useEffect, useRef, useState } from "react";
import { CameraIcon, CheckCircleIcon, ClipboardTextIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@src/components/primitives/button";
import { Dialog } from "@src/components/primitives/dialog";
import { QRScanner } from "@src/components/primitives/qr-scanner";
import { Tabs } from "@src/components/primitives/tabs";
import { decodeImportText } from "@src/lib/data-codec";
import { applyImportBundle, parseImportBundle, type ImportSummary } from "@src/lib/data-import";
import type { ExportBundle } from "@src/lib/data-export";

type Phase =
  | { kind: "input"; bundle: ExportBundle | null; parseError: string | null }
  | { kind: "applying" }
  | { kind: "done"; summary: ImportSummary }
  | { kind: "error"; message: string };

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>({
    kind: "input",
    bundle: null,
    parseError: null,
  });
  const [text, setText] = useState("");
  // Sequence guard: keystrokes can fire decode promises that resolve out
  // of order. Only the latest call commits its result.
  const parseSeqRef = useRef(0);

  // Reset on open so reopening starts clean instead of carrying old state.
  useEffect(() => {
    if (!open) return;
    setPhase({ kind: "input", bundle: null, parseError: null });
    setText("");
  }, [open]);

  function tryParse(next: string) {
    setText(next);
    const trimmed = next.trim();
    if (!trimmed) {
      setPhase({ kind: "input", bundle: null, parseError: null });
      return;
    }
    const seq = ++parseSeqRef.current;
    void (async () => {
      let decoded: string;
      try {
        // Strips the `EVCH1z:` marker + gunzips when present; otherwise
        // returns the input unchanged. Plain JSON paths flow through as
        // a no-op.
        decoded = await decodeImportText(next);
      } catch (err) {
        if (seq !== parseSeqRef.current) return;
        const message = err instanceof Error ? err.message : "Decode failed";
        setPhase({ kind: "input", bundle: null, parseError: message });
        return;
      }
      if (seq !== parseSeqRef.current) return;
      const result = parseImportBundle(decoded);
      if (result.ok) {
        setPhase({ kind: "input", bundle: result.bundle, parseError: null });
      } else {
        setPhase({ kind: "input", bundle: null, parseError: result.error });
      }
    })();
  }

  async function handleApply() {
    if (phase.kind !== "input" || !phase.bundle) return;
    setPhase({ kind: "applying" });
    try {
      const summary = await applyImportBundle(phase.bundle);
      setPhase({ kind: "done", summary });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      setPhase({ kind: "error", message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup className="max-w-lg">
          <Dialog.Title>Import reading data</Dialog.Title>
          <Dialog.Description>
            Restore a snapshot from another device. Existing data is kept — newer entries win on
            collisions.
          </Dialog.Description>

          {phase.kind === "input" ? (
            <InputPhase
              text={text}
              onTextChange={tryParse}
              bundle={phase.bundle}
              parseError={phase.parseError}
              onApply={() => void handleApply()}
              onCancel={() => onOpenChange(false)}
            />
          ) : phase.kind === "applying" ? (
            <p className="mt-6 text-style-caption text-fg-muted">Applying snapshot…</p>
          ) : phase.kind === "done" ? (
            <DonePhase summary={phase.summary} onClose={() => onOpenChange(false)} />
          ) : (
            <ErrorPhase
              message={phase.message}
              onClose={() => onOpenChange(false)}
              onRetry={() => setPhase({ kind: "input", bundle: null, parseError: null })}
            />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog>
  );
}

function InputPhase({
  text,
  onTextChange,
  bundle,
  parseError,
  onApply,
  onCancel,
}: {
  text: string;
  onTextChange: (s: string) => void;
  bundle: ExportBundle | null;
  parseError: string | null;
  onApply: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-5 flex flex-col gap-5">
      <Tabs defaultValue="paste">
        <Tabs.List>
          <Tabs.Tab value="paste">
            <ClipboardTextIcon
              weight="light"
              size={14}
              className="inline-block mr-1 align-[-2px]"
            />
            Paste
          </Tabs.Tab>
          <Tabs.Tab value="scan">
            <CameraIcon weight="light" size={14} className="inline-block mr-1 align-[-2px]" />
            Scan QR
          </Tabs.Tab>
          <Tabs.Indicator />
        </Tabs.List>

        <Tabs.Panel value="paste">
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Paste exported snapshot JSON…"
            spellCheck={false}
            className="font-mono text-style-caption text-fg bg-surface border border-border rounded-sm w-full h-40 p-3 resize-y focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
          />
        </Tabs.Panel>

        <Tabs.Panel value="scan">
          <QRScanner
            onDecoded={onTextChange}
            hint="Scans the QR shown on another device's export screen."
          />
        </Tabs.Panel>
      </Tabs>

      {parseError ? (
        <p className="inline-flex items-start gap-2 text-style-caption text-fg">
          <WarningIcon weight="fill" className="mt-0.5 shrink-0 text-accent" />
          {parseError}
        </p>
      ) : bundle ? (
        <BundlePreview bundle={bundle} />
      ) : null}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={onApply} disabled={!bundle}>
          Apply
        </Button>
      </div>
    </div>
  );
}

function BundlePreview({ bundle }: { bundle: ExportBundle }) {
  const rows: { label: string; value: string }[] = [
    { label: "Progress entries", value: String(bundle.data.chapterProgress?.length ?? 0) },
    { label: "Bookmarks", value: String(bundle.data.bookmarks?.length ?? 0) },
    { label: "Notes", value: String(bundle.data.notes?.length ?? 0) },
    { label: "Likes", value: String(bundle.data.reactions?.length ?? 0) },
    {
      label: "Reader settings",
      value: bundle.data.readerSettings != null ? "Included" : "Defaults",
    },
  ];
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-style-eyebrow text-fg-muted">Snapshot contents</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        {rows.map((r) => (
          <div key={r.label} className="contents">
            <dt className="text-style-caption text-fg-muted">{r.label}</dt>
            <dd className="text-style-caption text-fg tabular-nums text-right">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-style-caption text-fg-muted">
        Exported {new Date(bundle.exportedAt).toLocaleString()}
      </p>
    </div>
  );
}

function DonePhase({ summary, onClose }: { summary: ImportSummary; onClose: () => void }) {
  const lines: { label: string; value: string }[] = [
    {
      label: "Progress",
      value: tally(summary.progress.added, summary.progress.updated, summary.progress.skipped),
    },
    {
      label: "Bookmarks",
      value: tally(summary.bookmarks.added, summary.bookmarks.updated, summary.bookmarks.skipped),
    },
    {
      label: "Notes",
      value: tally(summary.notes.added, summary.notes.updated, summary.notes.skipped),
    },
    {
      label: "Likes",
      value: tally(summary.reactions.added, summary.reactions.updated, summary.reactions.skipped),
    },
    {
      label: "Reader settings",
      value: summary.readerSettingsApplied ? "Applied — refresh to see" : "Unchanged",
    },
  ];
  return (
    <div className="mt-5 flex flex-col gap-4">
      <p className="inline-flex items-center gap-2 text-style-body text-fg">
        <CheckCircleIcon weight="fill" className="text-accent" />
        Snapshot applied.
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        {lines.map((r) => (
          <div key={r.label} className="contents">
            <dt className="text-style-caption text-fg-muted">{r.label}</dt>
            <dd className="text-style-caption text-fg text-right">{r.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

function ErrorPhase({
  message,
  onClose,
  onRetry,
}: {
  message: string;
  onClose: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="mt-5 flex flex-col gap-4">
      <p className="inline-flex items-start gap-2 text-style-body text-fg">
        <WarningIcon weight="fill" className="mt-0.5 text-accent" />
        {message}
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}

function tally(added: number, updated: number, skipped: number): string {
  const parts: string[] = [];
  if (added) parts.push(`+${added}`);
  if (updated) parts.push(`${updated} updated`);
  if (skipped) parts.push(`${skipped} skipped`);
  return parts.length === 0 ? "0" : parts.join(" · ");
}
