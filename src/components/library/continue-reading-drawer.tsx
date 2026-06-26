import { Link } from "@src/components/primitives/link";
import { DotsThreeVerticalIcon, XIcon } from "@phosphor-icons/react";
import { Badge } from "@src/components/primitives/badge";
import { Drawer } from "@src/components/primitives/drawer";
import { IconButton } from "@src/components/primitives/icon-button";
import { Menu } from "@src/components/primitives/menu";
import { Progress } from "@src/components/primitives/progress";
import { ScrollArea } from "@src/components/primitives/scroll-area";
import { SinGlyph } from "@src/components/thematic/sin-glyph";
import {
  resetVolumeProgress,
  useInProgressVolumes,
  type VolumeInProgress,
} from "@src/lib/progress";

export function ContinueReadingDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const volumes = useInProgressVolumes();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Popup side="right" className="gap-0 p-0">
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <Drawer.Title>Continue Reading</Drawer.Title>
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Close continue reading"
              onClick={() => onOpenChange(false)}
            >
              <XIcon weight="light" />
            </IconButton>
          </header>

          {volumes.length === 0 ? (
            <p className="px-6 py-6 text-style-body text-fg-muted italic">
              Nothing in progress yet. Open a chapter and your reading will show up here.
            </p>
          ) : (
            <ScrollArea className="flex-1">
              <ul className="flex flex-col px-6 py-2">
                {volumes.map((v) => (
                  <VolumeRow
                    key={`${v.seriesId}:${v.volumeId}`}
                    volume={v}
                    onNavigate={() => onOpenChange(false)}
                  />
                ))}
              </ul>
            </ScrollArea>
          )}
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer>
  );
}

function VolumeRow({ volume, onNavigate }: { volume: VolumeInProgress; onNavigate: () => void }) {
  return (
    <li
      data-sin={volume.sin ?? undefined}
      className="flex items-center gap-1 border-b border-border last:border-b-0 py-2"
    >
      <Link
        to="/library/$seriesId/$volumeId/$chapterId/$pageNumber"
        params={{
          seriesId: volume.seriesId,
          volumeId: volume.volumeId,
          chapterId: volume.resumeChapterId,
          pageNumber: String(volume.resumePageNumber ?? 1),
        }}
        onClick={onNavigate}
        className="flex flex-1 flex-col gap-2 rounded-sm hover:bg-accent-soft -ml-2 px-2 py-2 transition-colors"
      >
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-style-eyebrow text-fg-muted line-clamp-1 flex-1">
                {volume.seriesTitle}
              </span>
              {volume.sin ? (
                <Badge
                  variant="soft"
                  size="sm"
                  className="capitalize shrink-0"
                  icon={<SinGlyph sin={volume.sin} weight="light" />}
                >
                  {volume.sin}
                </Badge>
              ) : null}
            </div>
            <span className="text-style-body text-fg line-clamp-1">{volume.volumeTitle}</span>
          </div>
          <span className="text-style-caption text-fg-muted shrink-0 tabular-nums">
            {volume.percent}%
          </span>
        </div>
        <Progress value={volume.percent} aria-label={`${volume.volumeTitle} progress`} />
      </Link>
      <Menu>
        <Menu.Trigger
          render={
            <IconButton size="sm" variant="ghost" aria-label={`Actions for ${volume.volumeTitle}`}>
              <DotsThreeVerticalIcon weight="bold" />
            </IconButton>
          }
        />
        <Menu.Portal>
          <Menu.Positioner align="end">
            <Menu.Popup>
              <Menu.Item onClick={() => void resetVolumeProgress(volume.chapterIds)}>
                Reset progress
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu>
    </li>
  );
}
