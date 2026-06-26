import { asset } from "@src/lib/asset";
import type { Page } from "@src/lib/schema";
import { ProseRenderer } from "./prose-renderer";

export function PageView({ page }: { page: Page }) {
  if (page.layout === "prose") {
    return <ProseRenderer text={page.text} />;
  }

  if (page.layout === "illustration") {
    return (
      <figure className="flex flex-col gap-3 my-8">
        <img
          src={asset(page.illustration.src)}
          alt={page.illustration.alt}
          className="w-full rounded-sm border border-border bg-surface"
        />
        {page.illustration.caption ? (
          <figcaption className="text-style-caption text-fg-muted text-center">
            {page.illustration.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  // spread
  return (
    <div className="flex flex-col gap-6">
      <figure className="flex flex-col gap-3">
        <img
          src={asset(page.illustration.src)}
          alt={page.illustration.alt}
          className="w-full rounded-sm border border-border bg-surface"
        />
        {page.illustration.caption ? (
          <figcaption className="text-style-caption text-fg-muted text-center">
            {page.illustration.caption}
          </figcaption>
        ) : null}
      </figure>
      <ProseRenderer text={page.text} />
    </div>
  );
}
