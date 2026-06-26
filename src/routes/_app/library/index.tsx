import { createFileRoute } from "@tanstack/react-router";
import { series } from "@src/routes/_app/library/-library";
import { SeriesCard } from "@src/components/library/series-card";

export const Route = createFileRoute("/_app/library/")({
  component: LibraryPage,
});

function LibraryPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <header className="mb-12 flex flex-col gap-3 max-w-2xl">
        <span className="text-style-eyebrow text-fg-muted">Thư viện</span>
        <h1 className="text-style-display text-fg">Story Forge</h1>
        <p className="text-style-lead text-fg-muted">
          Tuyển tập tiểu thuyết và truyện dài, đọc theo từng bộ và từng quyển.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {series.map((s) => (
          <SeriesCard key={s.id} series={s} />
        ))}
      </div>
    </div>
  );
}
