import { HeartIcon, XIcon } from "@phosphor-icons/react";
import { Link } from "@src/components/primitives/link";
import { Drawer } from "@src/components/primitives/drawer";
import { IconButton } from "@src/components/primitives/icon-button";
import { ScrollArea } from "@src/components/primitives/scroll-area";
import { series as seriesList } from "@src/routes/_app/library/-library";
import { useReactions, type Reaction } from "@src/lib/reactions";

export function LikesDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const seriesLikes = useReactions("series");

  const close = () => onOpenChange(false);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Popup side="right" className="gap-0 p-0">
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <Drawer.Title>Likes</Drawer.Title>
            <IconButton variant="ghost" size="sm" aria-label="Close likes" onClick={close}>
              <XIcon weight="light" />
            </IconButton>
          </header>

          {seriesLikes.length === 0 ? (
            <p className="px-6 py-6 text-style-body text-fg-muted italic">
              Nothing liked yet. Tap the heart on any series.
            </p>
          ) : (
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-6 px-6 py-4">
                <Section title="Series" reactions={seriesLikes}>
                  {(r) => <SeriesRow key={r.id} reaction={r} onNavigate={close} />}
                </Section>
              </div>
            </ScrollArea>
          )}
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer>
  );
}

function Section({
  title,
  reactions,
  children,
}: {
  title: string;
  reactions: Reaction[];
  children: (r: Reaction) => React.ReactNode;
}) {
  if (reactions.length === 0) return null;
  return (
    <section className="flex flex-col gap-1">
      <h2 className="text-style-eyebrow text-fg-muted mb-1">{title}</h2>
      <ul className="flex flex-col">{reactions.map((r) => children(r))}</ul>
    </section>
  );
}

function SeriesRow({ reaction, onNavigate }: { reaction: Reaction; onNavigate: () => void }) {
  const s = seriesList.find((x) => x.id === reaction.targetId);
  if (!s) return null;
  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        to="/library/$seriesId"
        params={{ seriesId: s.id }}
        onClick={onNavigate}
        className="flex items-center gap-3 -mx-2 px-2 py-2 rounded-sm hover:bg-accent-soft transition-colors"
      >
        <HeartIcon weight="fill" size={14} className="text-accent shrink-0" />
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-style-body text-fg line-clamp-1">{s.title}</span>
          <span className="text-style-caption text-fg-muted line-clamp-1">
            {s.volumes.length} volume{s.volumes.length !== 1 ? "s" : ""}
          </span>
        </div>
      </Link>
    </li>
  );
}
