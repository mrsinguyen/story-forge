import { Link } from "@src/components/primitives/link";
import { BookOpenIcon } from "@phosphor-icons/react";
import { Badge } from "@src/components/primitives/badge";
import { Button } from "@src/components/primitives/button";
import { asset } from "@src/lib/asset";
import { SinGlyph } from "@src/components/thematic/sin-glyph";
import type { VolumeMeta } from "@app/library/-volumes/_shared";

export function VolumeHero({ volume }: { volume: VolumeMeta }) {
  const firstChapter = volume.chapters[0];
  const { width, height } = volume.cover;
  const isPortrait = width && height ? height > width : true;

  const cover = (
    <img
      src={asset(volume.cover.src)}
      alt={volume.cover.alt}
      width={width}
      height={height}
      className={
        isPortrait
          ? // Fixed widths (not max-widths) so portrait covers all render at the
            // same size regardless of source resolution. `w-full max-w-*` on an
            // <img> in a flex item caps at the image's natural width when the
            // flex item has no explicit width — which silently shrinks any
            // cover whose natural pixels are below the cap.
            "w-72 rounded-sm border border-border shadow-md shadow-ink/30 md:w-96"
          : "mx-auto max-h-[70vh] w-auto max-w-full rounded-sm border border-border object-contain shadow-md shadow-ink/30"
      }
    />
  );

  const details = (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-style-eyebrow text-fg-muted">Volume {volume.number}</span>
        <h1 className="text-style-display text-fg">{volume.title}</h1>
        {volume.originalTitle ? (
          <p className="text-style-caption text-fg-muted">
            {volume.originalTitle}
            {volume.romanizedTitle ? <> · {volume.romanizedTitle}</> : null}
          </p>
        ) : null}
      </div>

      {volume.sin ? (
        <div>
          <Badge
            variant="soft"
            size="md"
            className="capitalize"
            icon={<SinGlyph sin={volume.sin} weight="light" />}
          >
            {volume.sin}
          </Badge>
        </div>
      ) : null}

      {volume.description ? (
        <p className="text-style-lead text-fg-muted">{volume.description}</p>
      ) : null}

      {firstChapter ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            render={
              <Link
                to="/library/$seriesId/$volumeId/$chapterId"
                params={{
                  seriesId: volume.series,
                  volumeId: volume.id,
                  chapterId: firstChapter.id,
                }}
              />
            }
          >
            <BookOpenIcon weight="light" />
            Start Reading
          </Button>
        </div>
      ) : null}
    </div>
  );

  if (isPortrait) {
    return (
      <section className="flex flex-col items-start gap-10 md:flex-row md:gap-12">
        {cover}
        {details}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-10">
      {cover}
      {details}
    </section>
  );
}
