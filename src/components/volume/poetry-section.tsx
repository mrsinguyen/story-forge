import type { Poetry } from "@src/lib/schema";

export function PoetrySection({ poetry }: { poetry: Poetry }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-style-eyebrow text-fg-muted">Opening Poetry</h2>
        <h3 className="text-style-heading-2 text-fg">{poetry.title}</h3>
        {poetry.attribution ? (
          <p className="text-style-caption text-fg-muted">{poetry.attribution}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-6 max-w-2xl">
        {poetry.stanzas.map((stanza, i) => (
          <div key={i} className="flex flex-col gap-1">
            {stanza.lines.map((line, j) => (
              <p key={j} className="text-style-quote text-fg">
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
