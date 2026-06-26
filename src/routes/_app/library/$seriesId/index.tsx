import { createFileRoute, notFound } from "@tanstack/react-router";
import { Link } from "@src/components/primitives/link";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { series } from "@src/routes/_app/library/-library";
import { VolumeCard } from "@src/components/library/volume-card";
import { ReactionButton } from "@src/components/library/reaction-button";

export const Route = createFileRoute("/_app/library/$seriesId/")({
  component: SeriesPage,
  loader: ({ params }) => {
    const found = series.find((s) => s.id === params.seriesId);
    if (!found) throw notFound();
    return found;
  },
});

function SeriesPage() {
  const s = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <Link
        to="/library"
        className="inline-flex items-center gap-1 text-style-eyebrow text-fg-muted hover:text-fg transition-colors mb-6"
      >
        <CaretLeftIcon size={14} />
        Library
      </Link>
      <header className="mb-12 flex flex-col gap-3 max-w-4xl">
        <span className="text-style-eyebrow text-fg-muted">Series</span>
        <div className="flex items-center gap-3">
          <h1 className="text-style-display text-fg">{s.title}</h1>
          <ReactionButton targetType="series" targetId={s.id} label={s.title} size="md" />
        </div>
        <p className="text-style-lead text-fg-muted whitespace-pre-line">{s.description}</p>
      </header>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {s.volumes.map((v) => (
          <VolumeCard key={v.id} seriesId={s.id} volume={v} />
        ))}
      </div>
    </div>
  );
}
