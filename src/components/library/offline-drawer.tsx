import { useState } from "react";
import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  CloudArrowDownIcon,
  CloudSlashIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Badge } from "@src/components/primitives/badge";
import { Button } from "@src/components/primitives/button";
import { Dialog } from "@src/components/primitives/dialog";
import { Drawer } from "@src/components/primitives/drawer";
import { IconButton } from "@src/components/primitives/icon-button";
import { Progress } from "@src/components/primitives/progress";
import { ScrollArea } from "@src/components/primitives/scroll-area";
import { SinGlyph } from "@src/components/thematic/sin-glyph";
import { availableVolumeIds } from "@app/library/-volumes";
import { series } from "@src/routes/_app/library/-library";
import type { SlimVolume } from "@app/library/-volumes/_shared";
import { useOfflineSync, useOnlineStatus, wipeOfflineCaches } from "@src/lib/offline";

export function OfflineDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const online = useOnlineStatus();
  const close = () => onOpenChange(false);
  const rows = collectVolumes();

  // Bumped after a wipe so every VolumeRow remounts and re-reads its
  // status — the per-row hook holds its own derived state and would
  // otherwise keep stale "complete" badges until each user-triggered
  // action reset them.
  const [nonce, setNonce] = useState(0);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function handleClearAll() {
    setClearing(true);
    try {
      await wipeOfflineCaches();
      setNonce((n) => n + 1);
      setClearOpen(false);
    } finally {
      setClearing(false);
    }
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Popup side="right" className="gap-0 p-0">
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <Drawer.Title>Offline reading</Drawer.Title>
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="Close offline drawer"
                onClick={close}
              >
                <XIcon weight="light" />
              </IconButton>
            </header>

            {!online && (
              <div
                role="status"
                className="flex items-start gap-2 border-b border-border bg-accent-soft px-6 py-3 text-style-caption text-fg-muted"
              >
                <CloudSlashIcon weight="light" className="mt-0.5 shrink-0" />
                <span>You're offline. Reconnect to download or refresh volumes.</span>
              </div>
            )}

            <ScrollArea className="flex-1">
              <ul className="flex flex-col">
                {rows.length === 0 ? (
                  <li className="px-6 py-6 text-style-body text-fg-muted italic">
                    No volumes available to download yet.
                  </li>
                ) : (
                  rows.map(({ slim, seriesTitle }) => (
                    <VolumeRow
                      key={`${slim.id}:${nonce}`}
                      slim={slim}
                      seriesTitle={seriesTitle}
                      online={online}
                    />
                  ))
                )}
              </ul>
            </ScrollArea>

            <footer className="border-t border-border px-6 py-4">
              <Button variant="secondary" size="sm" onClick={() => setClearOpen(true)}>
                <TrashIcon weight="light" />
                Delete all offline content
              </Button>
            </footer>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer>

      <Dialog open={clearOpen} onOpenChange={(o) => !clearing && setClearOpen(o)}>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Delete all offline content?</Dialog.Title>
            <Dialog.Description>
              Removes every downloaded chapter file and image from this device. The next time you
              open a volume online it'll be re-cached automatically. Your reading progress,
              bookmarks, and notes are not affected.
            </Dialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close
                render={
                  <Button variant="ghost" size="sm" disabled={clearing}>
                    Cancel
                  </Button>
                }
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleClearAll()}
                disabled={clearing}
              >
                {clearing ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}

function collectVolumes(): { slim: SlimVolume; seriesTitle: string }[] {
  const wired = new Set(availableVolumeIds);
  const rows: { slim: SlimVolume; seriesTitle: string }[] = [];
  for (const s of series) {
    for (const v of s.volumes) {
      if (wired.has(v.id)) rows.push({ slim: v, seriesTitle: s.title });
    }
  }
  return rows;
}

function VolumeRow({
  slim,
  seriesTitle,
  online,
}: {
  slim: SlimVolume;
  seriesTitle: string;
  online: boolean;
}) {
  const { state, download, resync, cancel } = useOfflineSync(slim.id);

  const totalPages = slim.chapters.reduce((sum, c) => sum + c.pageCount, 0);

  return (
    <li
      data-sin={slim.sin ?? undefined}
      className="flex flex-col gap-3 border-b border-border px-6 py-4 last:border-b-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-style-eyebrow text-fg-muted">{seriesTitle}</span>
          <span className="text-style-body text-fg line-clamp-2">{slim.title}</span>
          <span className="text-style-caption text-fg-muted tabular-nums">
            {slim.chapters.length} chapter{slim.chapters.length !== 1 ? "s" : ""} · {totalPages}{" "}
            page{totalPages !== 1 ? "s" : ""}
          </span>
        </div>
        {slim.sin ? (
          <Badge
            variant="soft"
            size="sm"
            className="capitalize"
            icon={<SinGlyph sin={slim.sin} weight="light" />}
          >
            {slim.sin}
          </Badge>
        ) : null}
      </div>

      <RowStatus state={state} />

      <RowActions
        state={state}
        online={online}
        onDownload={download}
        onResync={resync}
        onCancel={cancel}
      />
    </li>
  );
}

function RowStatus({ state }: { state: ReturnType<typeof useOfflineSync>["state"] }) {
  if (state.kind === "downloading") {
    const { done, total } = state.progress;
    const value = total === 0 ? 0 : Math.round((done / total) * 100);
    return (
      <div className="flex flex-col gap-1.5">
        <Progress value={value} size="sm" aria-label="Download progress" />
        <span className="text-style-caption text-fg-muted tabular-nums">
          {done} / {total} files · {value}%
        </span>
      </div>
    );
  }
  if (state.kind === "complete") {
    return (
      <span className="inline-flex items-center gap-1 text-style-caption text-accent">
        <CheckCircleIcon weight="fill" size={14} />
        Available offline
      </span>
    );
  }
  if (state.kind === "error") {
    const partial = state.status
      ? `${state.status.cached} / ${state.status.total} files cached`
      : null;
    return (
      <span className="text-style-caption text-fg-muted">
        Sync failed: {state.message}
        {partial ? ` · ${partial}` : ""}
      </span>
    );
  }
  // idle
  if (state.status && state.status.cached > 0 && !state.status.complete) {
    const { cached, total } = state.status;
    return (
      <span className="text-style-caption text-fg-muted tabular-nums">
        {cached} / {total} files cached
      </span>
    );
  }
  return <span className="text-style-caption text-fg-muted">Not downloaded</span>;
}

function RowActions({
  state,
  online,
  onDownload,
  onResync,
  onCancel,
}: {
  state: ReturnType<typeof useOfflineSync>["state"];
  online: boolean;
  onDownload: () => void;
  onResync: () => void;
  onCancel: () => void;
}) {
  if (state.kind === "downloading") {
    return (
      <div>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    );
  }
  if (state.kind === "complete") {
    return (
      <div>
        <Button variant="secondary" size="sm" onClick={onResync} disabled={!online}>
          <ArrowClockwiseIcon weight="light" />
          Refresh
        </Button>
      </div>
    );
  }
  // idle / error — both expose Download as the primary action.
  return (
    <div>
      <Button variant="primary" size="sm" onClick={onDownload} disabled={!online}>
        <CloudArrowDownIcon weight="light" />
        Download
      </Button>
    </div>
  );
}
