import {
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  ArrowElbowDownLeftIcon,
  BookOpenTextIcon,
  MagnifyingGlassIcon,
  StackIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Link } from "@src/components/primitives/link";
import { Dialog } from "@src/components/primitives/dialog";
import { IconButton } from "@src/components/primitives/icon-button";
import { ScrollArea } from "@src/components/primitives/scroll-area";
import { series } from "@app/library/-library";
import { cn } from "@src/lib/cn";

const PER_CATEGORY = 6;

type VolumeHit = {
  seriesId: string;
  seriesTitle: string;
  volumeId: string;
  title: string;
  subtitle: string;
};

type ChapterHit = {
  seriesId: string;
  volumeId: string;
  volumeTitle: string;
  chapterId: string;
  title: string;
};

type Results = {
  volumes: VolumeHit[];
  chapters: ChapterHit[];
  total: number;
};

function buildResults(query: string): Results {
  const q = query.trim().toLowerCase();
  // Empty query → render a default browse list (top-N of each category) so
  // the palette is useful as a directory before the user starts typing.
  // Match-against-haystack collapses to "include everything" when q is "".
  const matches = (hay: string) => q === "" || hay.includes(q);

  const volumes: VolumeHit[] = [];
  const chapters: ChapterHit[] = [];

  for (const s of series) {
    for (const v of s.volumes) {
      const volumeHay = [v.title, v.originalTitle, v.romanizedTitle]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (matches(volumeHay)) {
        const subParts = [v.originalTitle, v.romanizedTitle].filter(Boolean) as string[];
        volumes.push({
          seriesId: s.id,
          seriesTitle: s.title,
          volumeId: v.id,
          title: v.title,
          subtitle: subParts.length > 0 ? subParts.join(" · ") : s.title,
        });
      }
      for (const c of v.chapters) {
        if (matches(c.title.toLowerCase())) {
          chapters.push({
            seriesId: s.id,
            volumeId: v.id,
            volumeTitle: v.title,
            chapterId: c.id,
            title: c.title,
          });
        }
      }
    }
  }

  return {
    volumes: volumes.slice(0, PER_CATEGORY),
    chapters: chapters.slice(0, PER_CATEGORY),
    total: volumes.length + chapters.length,
  };
}

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  // Whether keyboard focus currently sits on a result row vs. on the input.
  // Drives the visual highlight: when the user is typing, no row should
  // appear "selected"; the highlight only shows once they Tab or arrow into
  // the list. Hover styling is handled separately via `:hover`.
  const [focusInList, setFocusInList] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Roving-tabindex ref array — sized to the flat result list so arrow-key
  // navigation can imperatively focus the next/previous row, and Enter on
  // a focused row activates it via the row's native click semantics.
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  // Reset the query whenever the dialog closes so the next opening starts
  // from an empty palette rather than the last session's input.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => buildResults(query), [query]);

  // Counts per section; offsets give each row its flat index for the
  // roving-tabindex / activeIndex bookkeeping below.
  const volCount = results.volumes.length;
  const chCount = results.chapters.length;
  const volOffset = 0;
  const chOffset = volOffset + volCount;
  const total = chOffset + chCount;

  // Keep the active index in range as the result list grows / shrinks.
  // Default the highlight to the first row so Enter-from-input has an
  // obvious target.
  useEffect(() => {
    setActiveIndex(0);
    itemRefs.current = Array.from<HTMLElement | null>({ length: total }).fill(null);
  }, [total]);

  function close() {
    onOpenChange(false);
  }

  function focusRow(index: number) {
    // Defer focus until after the current render so the row's tabIndex=0
    // is in place — focus() works on natively focusable elements (links,
    // buttons) regardless, but the scroll-into-view should follow paint.
    queueMicrotask(() => {
      const el = itemRefs.current[index];
      el?.focus();
      el?.scrollIntoView({ block: "nearest" });
    });
  }

  function moveActive(delta: number) {
    if (total === 0) return;
    setActiveIndex((prev) => {
      const next = (prev + delta + total) % total;
      focusRow(next);
      return next;
    });
  }

  function onInputKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (total === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      // First arrow-down from the input lands on the active row (which is
      // the first row by default) rather than incrementing past it. Once
      // the row gains focus, its onFocus flips `focusInList` true, so the
      // visual highlight kicks in only after the user has actually moved
      // into the list.
      focusRow(activeIndex);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      // ArrowUp from the input wraps to the last row.
      const last = total - 1;
      setActiveIndex(last);
      focusRow(last);
    }
    // No Enter handler on the input — without a visible highlight there's
    // no clear target to activate. Users press ArrowDown then Enter.
  }

  function onListKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveActive(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveActive(-1);
    }
    // Enter / Space activate the focused row natively.
  }

  function registerRef(index: number, el: HTMLElement | null) {
    itemRefs.current[index] = el;
  }

  function onRowFocus(index: number) {
    setActiveIndex(index);
    setFocusInList(true);
  }

  function onInputFocus() {
    setFocusInList(false);
  }

  function clearQuery() {
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup className="flex h-[min(640px,80vh)] w-[calc(100vw-2rem)] max-w-2xl flex-col p-0">
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
            <MagnifyingGlassIcon
              size={18}
              weight="light"
              className="shrink-0 text-fg-muted"
              aria-hidden
            />
            {/*
              Using `type="text"` rather than `type="search"` to suppress the
              browser-supplied X clear button — we already render an explicit
              close X for the dialog and the duplicate icons read as a single
              broken control. The dialog's own dismiss flow (Esc / backdrop /
              the close button) covers the "I'm done" path.
            */}
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              onFocus={onInputFocus}
              placeholder="Search volumes, chapters..."
              aria-label="Search"
              aria-controls="search-results"
              aria-activedescendant={
                focusInList && total > 0 ? `search-row-${activeIndex}` : undefined
              }
              className="h-8 flex-1 bg-transparent font-serif text-base text-fg placeholder:text-fg-muted focus:outline-none"
            />
            {query ? (
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="Clear search"
                onClick={clearQuery}
                // Outside the input ↔ active-row tab cycle so Tab stays a
                // two-stop loop (input ↔ first / active result).
                tabIndex={-1}
                className="shrink-0"
              >
                <XIcon weight="light" />
              </IconButton>
            ) : null}
          </div>
          <ScrollArea className="min-h-0 flex-1">
            {results.total === 0 ? (
              <p className="px-6 py-8 text-style-body italic text-fg-muted">
                No results for &ldquo;{query}&rdquo;.
              </p>
            ) : (
              <div
                id="search-results"
                role="listbox"
                aria-label="Search results"
                onKeyDown={onListKeyDown}
                className="flex flex-col py-2"
              >
                {results.volumes.length > 0 ? (
                  <Section label="Volumes">
                    {results.volumes.map((v, i) => {
                      const idx = volOffset + i;
                      return (
                        <ResultRow
                          key={`v:${v.seriesId}:${v.volumeId}`}
                          index={idx}
                          isActive={idx === activeIndex}
                          highlight={focusInList && idx === activeIndex}
                          registerRef={registerRef}
                          onRowFocus={onRowFocus}
                          icon={<StackIcon weight="light" />}
                          title={v.title}
                          subtitle={v.subtitle}
                          render={
                            <Link
                              to="/library/$seriesId/$volumeId"
                              params={{ seriesId: v.seriesId, volumeId: v.volumeId }}
                              onClick={close}
                            />
                          }
                        />
                      );
                    })}
                  </Section>
                ) : null}
                {results.chapters.length > 0 ? (
                  <Section label="Chapters">
                    {results.chapters.map((c, i) => {
                      const idx = chOffset + i;
                      return (
                        <ResultRow
                          key={`c:${c.seriesId}:${c.volumeId}:${c.chapterId}`}
                          index={idx}
                          isActive={idx === activeIndex}
                          highlight={focusInList && idx === activeIndex}
                          registerRef={registerRef}
                          onRowFocus={onRowFocus}
                          icon={<BookOpenTextIcon weight="light" />}
                          title={c.title}
                          subtitle={c.volumeTitle}
                          render={
                            <Link
                              to="/library/$seriesId/$volumeId/$chapterId"
                              params={{
                                seriesId: c.seriesId,
                                volumeId: c.volumeId,
                                chapterId: c.chapterId,
                              }}
                              onClick={close}
                            />
                          }
                        />
                      );
                    })}
                  </Section>
                ) : null}
              </div>
            )}
          </ScrollArea>
          <div className="flex shrink-0 items-center gap-2 border-t border-border px-4 py-2 text-style-caption text-fg-muted">
            <kbd
              aria-label="Return"
              className="inline-flex h-5 w-5 items-center justify-center rounded-xs border border-border"
            >
              <ArrowElbowDownLeftIcon size={12} weight="bold" aria-hidden />
            </kbd>
            <span>Go to page</span>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="px-4 pb-1 pt-3 text-style-eyebrow text-fg-muted">{label}</span>
      <ul className="flex flex-col">{children}</ul>
    </div>
  );
}

type ResultRowProps = {
  index: number;
  // Selection state for ARIA + roving-tabindex bookkeeping. Always tracks
  // which row is logically "active", even while focus is in the input.
  isActive: boolean;
  // Whether to *visually* highlight this row. Distinct from `isActive` so
  // the highlight only appears once focus has moved into the list — keeps
  // the input from competing with a persistent row selection.
  highlight: boolean;
  registerRef: (index: number, el: HTMLElement | null) => void;
  onRowFocus: (index: number) => void;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  render?: ReactNode;
  onClick?: () => void;
};

function ResultRow({
  index,
  isActive,
  highlight,
  registerRef,
  onRowFocus,
  icon,
  title,
  subtitle,
  render,
  onClick,
}: ResultRowProps) {
  const content = (
    <>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-fg-muted">
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-style-body text-fg">{title}</span>
        {subtitle ? (
          <span className="truncate text-style-caption text-fg-muted">{subtitle}</span>
        ) : null}
      </div>
    </>
  );

  // Visual highlight only applies once focus is in the list — see the
  // `highlight` prop docs above. Hover styling is independent so the mouse
  // cursor still reads as interactive without competing with keyboard
  // selection. `focus-visible:bg-accent-soft` mirrors the highlight at the
  // CSS layer so Tab-from-input lands the bg synchronously with the outline,
  // instead of waiting on the React onFocus → setState → re-render tick that
  // would otherwise leak a 150ms `transition-colors` fade-in.
  const className = cn(
    "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors",
    "hover:bg-accent-soft",
    highlight && "bg-accent-soft",
    "outline-accent outline-offset-[-2px]",
    "focus:outline-none focus-visible:bg-accent-soft focus-visible:outline-2",
  );

  const setRef = (el: HTMLElement | null) => registerRef(index, el);
  const sharedProps = {
    id: `search-row-${index}`,
    role: "option",
    "aria-selected": isActive,
    tabIndex: isActive ? 0 : -1,
    onFocus: () => onRowFocus(index),
  };

  if (isValidElement(render)) {
    // The element passed via `render` becomes the row's interactive surface
    // (typically a <Link>). Clone it with the row className + roving
    // tabindex + a callback ref so arrow-key nav can focus it imperatively.
    // Cast through `any`-shaped props because TanStack Router's `<Link>`
    // generic prop type doesn't unify with the structural shape we want
    // here (className / ref / tabIndex / role).
    const el = render as ReactElement<Record<string, unknown>>;
    const existingClass = (el.props.className ?? "") as string;
    const merged = cn(className, existingClass);
    return <li>{cloneElement(el, { className: merged, ref: setRef, ...sharedProps }, content)}</li>;
  }

  return (
    <li>
      <button
        ref={setRef as (el: HTMLButtonElement | null) => void}
        type="button"
        className={className}
        onClick={onClick}
        {...sharedProps}
      >
        {content}
      </button>
    </li>
  );
}
