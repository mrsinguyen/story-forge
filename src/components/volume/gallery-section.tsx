import { asset } from "@src/lib/asset";
import type { ArtworkPage } from "@src/lib/schema";

export function GallerySection({ gallery, label }: { gallery: ArtworkPage[]; label: string }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-style-eyebrow text-fg-muted">{label}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {gallery.map((art, i) => (
          <figure key={i} className="flex flex-col gap-2">
            <img
              src={asset(art.illustration.src)}
              alt={art.illustration.alt}
              className="w-full rounded-sm border border-border bg-surface"
            />
            {art.caption ? (
              <figcaption className="text-style-caption text-fg-muted">{art.caption}</figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
