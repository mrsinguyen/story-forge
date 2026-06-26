import { Link } from "@src/components/primitives/link";
import { Card } from "@src/components/primitives/card";
import { Badge } from "@src/components/primitives/badge";
import { ReactionButton } from "@src/components/library/reaction-button";
import { SinGlyph } from "@src/components/thematic/sin-glyph";
import { isVolumeAvailable } from "@app/library/-volumes";
import type { Series, Sin } from "@src/routes/_app/library/-library";

export function SeriesCard({ series }: { series: Series }) {
  const sins = [...new Set(series.volumes.map((v) => v.sin).filter((s): s is Sin => Boolean(s)))];
  const total = series.volumes.length;
  const available = series.volumes.filter((v) => isVolumeAvailable(v.id)).length;

  const stats: string[] = [];
  if (total > 0) {
    stats.push(
      available > 0
        ? `${available} of ${total} volume${total !== 1 ? "s" : ""} available`
        : `${total} volume${total !== 1 ? "s" : ""}, none yet available`,
    );
  }

  return (
    <div className="relative h-full">
      <Link to="/library/$seriesId" params={{ seriesId: series.id }} className="block h-full">
        <Card variant="interactive">
          <Card.Header>
            <Card.Title className="pr-10">{series.title}</Card.Title>
            {stats.length > 0 ? <Card.Description>{stats.join(" · ")}</Card.Description> : null}
          </Card.Header>
          <Card.Body>
            <p className="line-clamp-3 text-fg-muted">{series.description}</p>
          </Card.Body>
          <Card.Footer>
            <div className="flex flex-wrap gap-1.5">
              {sins.length > 0 ? (
                sins.map((sin) => (
                  <span key={sin} data-sin={sin}>
                    <Badge
                      variant="soft"
                      size="sm"
                      className="capitalize"
                      icon={<SinGlyph sin={sin} weight="light" />}
                    >
                      {sin}
                    </Badge>
                  </span>
                ))
              ) : (
                <Badge variant="outline" size="sm">
                  Tiên hiệp
                </Badge>
              )}
            </div>
          </Card.Footer>
        </Card>
      </Link>
      <ReactionButton
        targetType="series"
        targetId={series.id}
        label={series.title}
        className="absolute right-2 top-2"
      />
    </div>
  );
}
