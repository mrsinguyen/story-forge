import { createFileRoute, notFound } from "@tanstack/react-router";
import { Link } from "@src/components/primitives/link";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { series } from "@src/routes/_app/library/-library";
import { getVolumeMeta } from "@app/library/-volumes";
import { ChapterList } from "@src/components/library/chapter-list";
import { Badge } from "@src/components/primitives/badge";
import { Progress } from "@src/components/primitives/progress";
import { VolumeHero } from "@src/components/volume/volume-hero";
import { TitlePageSection } from "@src/components/volume/title-page-section";
import { PoetrySection } from "@src/components/volume/poetry-section";
import { GallerySection } from "@src/components/volume/gallery-section";
import { Ornament } from "@src/components/thematic/ornament";
import { IconButton } from "@src/components/primitives/icon-button";
import { Menu } from "@src/components/primitives/menu";
import { DotsThreeVerticalIcon } from "@phosphor-icons/react";
import { markVolumeComplete, resetVolumeProgress, useVolumeProgress } from "@src/lib/progress";
import type { Chapter } from "@src/routes/_app/library/-library";

export const Route = createFileRoute("/_app/library/$seriesId/$volumeId/")({
  component: VolumePage,
  loader: async ({ params }) => {
    const s = series.find((x) => x.id === params.seriesId);
    const slim = s?.volumes.find((x) => x.id === params.volumeId);
    if (!s || !slim) throw notFound();
    // `meta` carries hero/poetry/gallery/title-page metadata + the slim
    // chapter list. No chapter `.md` content is fetched here — that's
    // deferred to the page reader on a per-chapter basis.
    const meta = await getVolumeMeta(params.volumeId);
    return { series: s, slim, meta };
  },
});

function VolumePage() {
  const { series: s, slim, meta } = Route.useLoaderData();

  const { totalPages, percent: overall } = useVolumeProgress(slim.chapters);
  const chapterCount = slim.chapters.filter((c) => c.kind !== "afterword").length;

  return (
    <div data-sin={slim.sin ?? undefined} className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <Link
        to="/library/$seriesId"
        params={{ seriesId: s.id }}
        className="inline-flex items-center gap-1 text-style-eyebrow text-fg-muted hover:text-fg transition-colors mb-8"
      >
        <CaretLeftIcon size={14} />
        {s.title}
      </Link>

      {meta ? (
        <VolumeHero volume={meta} />
      ) : (
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-style-eyebrow text-fg-muted">Volume {slim.number}</span>
            {slim.sin ? (
              <Badge variant="soft" size="sm" className="capitalize">
                {slim.sin}
              </Badge>
            ) : null}
          </div>
          <h1 className="text-style-display text-fg">{slim.title}</h1>
        </header>
      )}

      <div className="mt-12 flex flex-col">
        <section className="flex flex-col gap-4">
          <h2 className="text-style-eyebrow text-fg-muted">Chapters</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-style-caption text-fg-muted">
              <span>
                {chapterCount} chapter{chapterCount !== 1 ? "s" : ""} · {totalPages} pages
              </span>
              <div className="flex items-center gap-1">
                <span>{overall}%</span>
                <VolumeProgressMenu chapters={slim.chapters} percent={overall} />
              </div>
            </div>
            <Progress value={overall} aria-label={`${slim.title} reading progress`} />
          </div>
          <ChapterList seriesId={s.id} volumeId={slim.id} chapters={slim.chapters} />
        </section>

        {meta?.openingPoetry ? (
          <>
            <Ornament glyph="❦" className="mt-4" />
            <PoetrySection poetry={meta.openingPoetry} />
          </>
        ) : null}

        {meta?.openingGallery && meta.openingGallery.length > 0 ? (
          <>
            <Ornament glyph="❀" />
            <GallerySection gallery={meta.openingGallery} label="Opening Gallery" />
          </>
        ) : null}

        {meta ? (
          <>
            <Ornament glyph="☙" />
            <TitlePageSection volume={meta} />
          </>
        ) : null}
      </div>
    </div>
  );
}

function VolumeProgressMenu({ chapters, percent }: { chapters: Chapter[]; percent: number }) {
  return (
    <Menu>
      <Menu.Trigger
        render={
          <IconButton size="sm" variant="ghost" aria-label="Volume progress actions">
            <DotsThreeVerticalIcon weight="bold" />
          </IconButton>
        }
      />
      <Menu.Portal>
        <Menu.Positioner align="end">
          <Menu.Popup>
            <Menu.Item disabled={percent === 100} onClick={() => void markVolumeComplete(chapters)}>
              Mark all complete
            </Menu.Item>
            <Menu.Item
              disabled={percent === 0}
              onClick={() => void resetVolumeProgress(chapters.map((c) => c.id))}
            >
              Reset all progress
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu>
  );
}
