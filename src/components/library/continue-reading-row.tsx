import { Badge } from "@src/components/primitives/badge";
import { Link } from "@src/components/primitives/link";
import { Progress } from "@src/components/primitives/progress";
import { SinGlyph } from "@src/components/thematic/sin-glyph";
import { useInProgressVolumes, type VolumeInProgress } from "@src/lib/progress";
import { cn } from "@src/lib/cn";

const MAX_ROWS = 3;

export function ContinueReadingRow() {
  const volumes = useInProgressVolumes();
  const top = volumes.slice(0, MAX_ROWS);

  if (top.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 w-full max-w-3xl">
      <span className="text-style-eyebrow text-fg-muted text-center">Continue reading</span>
      <ul
        className={cn(
          "grid grid-cols-1 gap-3",
          top.length === 1 && "max-w-sm mx-auto",
          top.length === 2 && "sm:grid-cols-2 max-w-sm sm:max-w-2xl mx-auto",
          top.length >= 3 && "sm:grid-cols-3",
        )}
      >
        {top.map((v) => (
          <Card key={`${v.seriesId}:${v.volumeId}`} volume={v} />
        ))}
      </ul>
    </section>
  );
}

function Card({ volume: v }: { volume: VolumeInProgress }) {
  return (
    <li data-sin={v.sin ?? undefined} className="flex">
      <Link
        to="/library/$seriesId/$volumeId/$chapterId/$pageNumber"
        params={{
          seriesId: v.seriesId,
          volumeId: v.volumeId,
          chapterId: v.resumeChapterId,
          pageNumber: String(v.resumePageNumber ?? 1),
        }}
        className="flex flex-1 flex-col gap-2 rounded-sm border border-border bg-surface p-4 transition-colors hover:bg-accent-soft hover:border-accent"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-style-eyebrow text-fg-muted line-clamp-1 flex-1">
            {v.seriesTitle}
          </span>
          {v.sin ? (
            <Badge
              variant="soft"
              size="sm"
              className="capitalize shrink-0"
              icon={<SinGlyph sin={v.sin} weight="light" />}
            >
              {v.sin}
            </Badge>
          ) : null}
        </div>
        <span className="text-style-body text-fg line-clamp-2 flex-1">{v.volumeTitle}</span>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-style-caption text-fg-muted">
            <span className="line-clamp-1">
              {v.pagesRead} / {v.totalPages} pages
            </span>
            <span className="tabular-nums">{v.percent}%</span>
          </div>
          <Progress value={v.percent} aria-label={`${v.volumeTitle} progress`} />
        </div>
      </Link>
    </li>
  );
}
