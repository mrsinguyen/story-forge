import { useState } from "react";
import { DownloadSimpleIcon, UploadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@src/components/primitives/button";
import { Drawer } from "@src/components/primitives/drawer";
import { IconButton } from "@src/components/primitives/icon-button";
import { ExportDialog } from "./export-dialog";
import { ImportDialog } from "./import-dialog";

export function DataDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Popup side="right" className="gap-0 p-0">
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <Drawer.Title>Backup &amp; restore</Drawer.Title>
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="Close data drawer"
                onClick={() => onOpenChange(false)}
              >
                <XIcon weight="light" />
              </IconButton>
            </header>

            <div className="flex flex-col gap-6 px-6 py-5">
              <p className="text-style-body text-fg-muted">
                Move your reading data — progress, bookmarks, notes, likes, and reader settings —
                between devices.
              </p>

              <Section
                title="Export"
                description="Snapshot your data as JSON. Copy to clipboard or scan a QR code on another device."
              >
                <Button variant="primary" size="sm" onClick={() => setExportOpen(true)}>
                  <DownloadSimpleIcon weight="light" />
                  Export data
                </Button>
              </Section>

              <Section
                title="Import"
                description="Paste an exported snapshot or scan a QR code to restore data on this device. Existing data is kept; newer entries win on collisions."
              >
                <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
                  <UploadSimpleIcon weight="light" />
                  Import data
                </Button>
              </Section>
            </div>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-style-eyebrow text-fg-muted">{title}</h2>
        <p className="text-style-caption text-fg-muted">{description}</p>
      </div>
      <div className="flex flex-col items-start gap-2">{children}</div>
    </section>
  );
}
