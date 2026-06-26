import { Link } from "@src/components/primitives/link";
import { ArrowRightIcon } from "@phosphor-icons/react";
import type { Chapter } from "@src/lib/schema";

type Props = {
  seriesId: string;
  volumeId: string;
  next: Chapter;
};

export function NextChapterCTA({ seriesId, volumeId, next }: Props) {
  return (
    <Link
      to="/library/$seriesId/$volumeId/$chapterId"
      params={{ seriesId, volumeId, chapterId: next.id }}
      className="group mt-16 flex items-center justify-between gap-6 rounded-sm border border-border bg-surface p-6 transition-colors hover:bg-accent-soft hover:border-accent"
    >
      <div className="flex flex-col gap-1.5 min-w-0">
        <span className="text-style-eyebrow text-fg-muted group-hover:text-accent transition-colors">
          Next chapter
        </span>
        <span className="text-style-heading-3 text-fg line-clamp-2">{next.title}</span>
      </div>
      <ArrowRightIcon
        size={28}
        weight="light"
        className="shrink-0 text-fg-muted group-hover:text-accent transition-colors"
      />
    </Link>
  );
}
