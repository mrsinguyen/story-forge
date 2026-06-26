import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@src/components/primitives/button";
import { Dialog } from "@src/components/primitives/dialog";
import { QRCode } from "@src/components/primitives/qr-code";
import { encodeForQr } from "@src/lib/data-codec";
import { buildExportBundle, summarize, type ExportSummary } from "@src/lib/data-export";

// QR codes get unreliable for phone cameras above ~1500 bytes; the encoder
// itself caps out near 2950 bytes (Version 40, EC level L). Above the soft
// limit we show a warning; above the hard limit we skip the QR entirely.
// The payload going through these gates is the gzip+base64 form, so the
// raw JSON can be ~2-3x larger and still fit.
const QR_SOFT_LIMIT = 1500;
const QR_HARD_LIMIT = 2900;

type State =
  | { kind: "loading" }
  | {
      kind: "ready";
      json: string;
      summary: ExportSummary;
      qrPayload: string;
      qrBytes: number;
    }
  | { kind: "error"; message: string };

export function ExportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [copied, setCopied] = useState(false);

  // Build the bundle whenever the dialog is opened — keeps the snapshot
  // fresh if the user adds notes / bookmarks before reopening.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState({ kind: "loading" });
    setCopied(false);

    void (async () => {
      try {
        const bundle = await buildExportBundle();
        const json = JSON.stringify(bundle);
        const summary = summarize(bundle, json);
        const qrPayload = await encodeForQr(json);
        const qrBytes = new TextEncoder().encode(qrPayload).byteLength;
        if (!cancelled) setState({ kind: "ready", json, summary, qrPayload, qrBytes });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Export failed";
        setState({ kind: "error", message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Reset the "Copied!" indicator after a short delay so the user gets
  // feedback but the button doesn't stay stuck in the success state.
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function handleCopy() {
    if (state.kind !== "ready") return;
    try {
      await navigator.clipboard.writeText(state.json);
      setCopied(true);
    } catch {
      // Clipboard API can fail in insecure contexts / restrictive browsers.
      // Fall back to a manual prompt-style flow: select the JSON in a temp
      // textarea so the user can copy it themselves.
      const ta = document.createElement("textarea");
      ta.value = state.json;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup className="max-w-lg">
          <Dialog.Title>Export reading data</Dialog.Title>
          <Dialog.Description>
            A snapshot of your progress, bookmarks, notes, likes, and reader settings.
          </Dialog.Description>

          {state.kind === "loading" ? (
            <p className="mt-6 text-style-caption text-fg-muted">Building snapshot…</p>
          ) : state.kind === "error" ? (
            <p className="mt-6 inline-flex items-center gap-2 text-style-caption text-fg">
              <WarningIcon weight="fill" className="text-accent" />
              {state.message}
            </p>
          ) : (
            <>
              <SummaryGrid summary={state.summary} />

              <div className="mt-5 flex items-center gap-3">
                <Button variant="primary" size="sm" onClick={handleCopy}>
                  {copied ? <CheckIcon weight="bold" /> : <CopyIcon weight="light" />}
                  {copied ? "Copied" : "Copy to clipboard"}
                </Button>
                <span className="text-style-caption text-fg-muted tabular-nums">
                  {formatBytes(state.summary.bytes)}
                </span>
              </div>

              <div className="mt-6 border-t border-border pt-5">
                <h3 className="text-style-eyebrow text-fg-muted mb-3">QR code</h3>
                <QrSection
                  payload={state.qrPayload}
                  bytes={state.qrBytes}
                  rawBytes={state.summary.bytes}
                />
              </div>
            </>
          )}

          <div className="mt-6 flex justify-end">
            <Dialog.Close
              render={
                <Button variant="ghost" size="sm">
                  Close
                </Button>
              }
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog>
  );
}

function SummaryGrid({ summary }: { summary: ExportSummary }) {
  const rows: { label: string; value: string }[] = [
    { label: "Progress entries", value: String(summary.progress) },
    { label: "Bookmarks", value: String(summary.bookmarks) },
    { label: "Notes", value: String(summary.notes) },
    { label: "Likes", value: String(summary.reactions) },
    { label: "Reader settings", value: summary.hasReaderSettings ? "Included" : "Defaults" },
  ];
  return (
    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2">
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className="text-style-caption text-fg-muted">{r.label}</dt>
          <dd className="text-style-caption text-fg tabular-nums text-right">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function QrSection({
  payload,
  bytes,
  rawBytes,
}: {
  payload: string;
  bytes: number;
  rawBytes: number;
}) {
  if (bytes > QR_HARD_LIMIT) {
    return (
      <p className="inline-flex items-start gap-2 text-style-caption text-fg-muted">
        <WarningIcon weight="fill" className="mt-0.5 shrink-0 text-accent" />
        Snapshot is too large ({formatBytes(bytes)} compressed) to encode in a QR code. Use
        clipboard copy instead.
      </p>
    );
  }
  const oversized = bytes > QR_SOFT_LIMIT;
  const sizeNote = `${formatBytes(bytes)} compressed (from ${formatBytes(rawBytes)} JSON)`;
  return (
    <div className="flex flex-col items-center gap-3">
      <QRCode
        data={payload}
        size={256}
        alt="Export bundle QR code"
        fallback={
          <p className="text-style-caption text-fg-muted">
            Snapshot couldn't be encoded — use clipboard copy instead.
          </p>
        }
      />
      {oversized ? (
        <p className="inline-flex items-center gap-2 text-style-caption text-fg-muted">
          <WarningIcon weight="fill" className="text-accent" />
          {sizeNote} — may be hard to scan on some phones. Clipboard is more reliable.
        </p>
      ) : (
        <p className="text-style-caption text-fg-muted">
          {sizeNote}. Scan from another device's import screen to transfer.
        </p>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
