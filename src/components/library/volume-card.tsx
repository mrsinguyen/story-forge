import { Link } from "@src/components/primitives/link";
import { Card } from "@src/components/primitives/card";
import { Badge } from "@src/components/primitives/badge";
import { Progress } from "@src/components/primitives/progress";
import { SinGlyph } from "@src/components/thematic/sin-glyph";
import { isVolumeAvailable } from "@app/library/-volumes";
import { useVolumeProgress } from "@src/lib/progress";
import type { Volume } from "@src/routes/_app/library/-library";

export function VolumeCard({ seriesId, volume }: { seriesId: string; volume: Volume }) {
  const { percent: overall } = useVolumeProgress(volume.chapters);
  const available = isVolumeAvailable(volume.id);

  return (
    <div data-sin={volume.sin ?? undefined} className={available ? "h-full" : "h-full opacity-60"}>
      <Link
        to="/library/$seriesId/$volumeId"
        params={{ seriesId, volumeId: volume.id }}
        className="block h-full rounded-sm focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        <Card variant="interactive">
          <Card.Header>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-style-eyebrow text-fg-muted">Volume {volume.number}</span>
                <Card.Title className="mt-1">{volume.title}</Card.Title>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {volume.sin ? (
                  <Badge
                    variant="soft"
                    size="sm"
                    className="capitalize"
                    icon={<SinGlyph sin={volume.sin} weight="light" />}
                  >
                    {volume.sin}
                  </Badge>
                ) : null}
                {!available ? (
                  <Badge variant="outline" size="sm">
                    Pending
                  </Badge>
                ) : null}
              </div>
            </div>
          </Card.Header>
          <Card.Body className="flex flex-col justify-end">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-style-caption text-fg-muted">
                  {volume.chapters.length} chapter{volume.chapters.length !== 1 ? "s" : ""}
                </span>
                <span className="text-style-caption text-fg-muted">{overall}%</span>
              </div>
              <Progress value={overall} aria-label={`${volume.title} reading progress`} />
            </div>
          </Card.Body>
        </Card>
      </Link>
    </div>
  );
}
