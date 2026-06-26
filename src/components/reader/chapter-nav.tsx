import { Link } from "@src/components/primitives/link";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import type { Chapter } from "@src/lib/schema";

type Props = {
  seriesId: string;
  volumeId: string;
  prev: Chapter | null;
  next: Chapter | null;
};

const itemClass =
  "group flex flex-1 flex-col gap-1 rounded-sm border border-border p-4 hover:bg-accent-soft hover:border-accent transition-colors";

export function ChapterNav({ seriesId, volumeId, prev, next }: Props) {
  return (
    <nav className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-12 pt-8 border-t border-border">
      {prev ? (
        <Link
          to="/library/$seriesId/$volumeId/$chapterId"
          params={{ seriesId, volumeId, chapterId: prev.id }}
          className={itemClass}
        >
          <span className="inline-flex items-center gap-1 text-style-eyebrow text-fg-muted group-hover:text-accent transition-colors">
            <CaretLeftIcon size={14} />
            Previous
          </span>
          <span className="text-style-body text-fg">{prev.title}</span>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to="/library/$seriesId/$volumeId/$chapterId"
          params={{ seriesId, volumeId, chapterId: next.id }}
          className={`${itemClass} sm:text-right`}
        >
          <span className="inline-flex items-center gap-1 sm:justify-end text-style-eyebrow text-fg-muted group-hover:text-accent transition-colors">
            Next
            <CaretRightIcon size={14} />
          </span>
          <span className="text-style-body text-fg">{next.title}</span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
