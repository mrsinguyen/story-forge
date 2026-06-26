import { Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowClockwiseIcon,
  BookOpenTextIcon,
  BookmarkSimpleIcon,
  CloudArrowDownIcon,
  GearIcon,
  HeartIcon,
  ListIcon,
  MagnifyingGlassIcon,
  NotebookIcon,
} from "@phosphor-icons/react";
import { ScrollArea } from "@src/components/primitives/scroll-area";
import { IconButton } from "@src/components/primitives/icon-button";
import { Link } from "@src/components/primitives/link";
import { Menu } from "@src/components/primitives/menu";
import { cn } from "@src/lib/cn";
import { forceUpdate } from "@src/lib/pwa";
import { useOnlineStatus } from "@src/lib/offline";
import { asset } from "@src/lib/asset";
import { ThemeToggle } from "./theme-toggle";
import { BookmarksDrawer } from "@src/components/library/bookmarks-drawer";
import { ContinueReadingDrawer } from "@src/components/library/continue-reading-drawer";
import { LikesDrawer } from "@src/components/library/likes-drawer";
import { NotesDrawer } from "@src/components/library/notes-drawer";
import { OfflineDrawer } from "@src/components/library/offline-drawer";
import { SearchDialog } from "@src/components/library/search-dialog";
import { SettingsDrawer } from "@src/components/library/settings-drawer";

// Drawers and dialogs are mounted alongside the app shell so the first open
// has no JS-chunk fetch / `Suspense` fallback gap — base-ui's open animation
// is the only transition the user sees. Internal data comes from Dexie via
// `useLiveQuery` and renders an empty list while the IDB read streams in,
// so no spinner is needed either.

export function AppShell() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [continueOpen, setContinueOpen] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // Used to disable "Reload for updates" when offline — the nuclear path in
  // `forceUpdate` unregisters the SW before reloading, so without a network
  // the next navigation has nothing to fall back to and the app breaks.
  const online = useOnlineStatus();

  // Detect macOS once at mount so the search-trigger hint reads "⌘K" on
  // Mac and "Ctrl K" everywhere else. SSR-safe via the typeof guard.
  const isMac = useMemo(
    () => typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.platform),
    [],
  );

  // Cmd/Ctrl+K toggles the search palette globally. Skip when the user is
  // mid-edit in a contentEditable surface so reader annotations etc. keep
  // their own bindings — plain inputs/textareas don't claim ⌘K so we let
  // it through unconditionally there.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "k" && e.key !== "K") return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      e.preventDefault();
      setSearchOpen((open) => !open);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Reset scroll on route change — the ScrollArea's own viewport scrolls,
  // not the document, so the router's default scroll restoration won't apply.
  useEffect(() => {
    viewportRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  // Force a fresh version on demand. The standalone PWA has no URL bar,
  // and iOS Safari clings to disk-cached HTML, so the menu button defers
  // to `forceUpdate` which knows how to wait for the SW hand-off and how
  // to fall back to the unregister-and-reload path when needed.
  function hardReload() {
    void forceUpdate();
  }

  return (
    <div className="h-screen flex flex-col bg-bg">
      {/*
        Skip link — first focusable element on the page. Hidden visually until
        focused, at which point it pops into the top-left so a keyboard user
        can jump past the topbar straight to the main content. The target
        `<main tabIndex={-1}>` accepts programmatic focus on activation.
      */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:rounded-sm focus-visible:bg-surface focus-visible:text-fg focus-visible:px-3 focus-visible:py-2 focus-visible:text-style-eyebrow focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        Skip to main content
      </a>
      <header className={cn("shrink-0 rounded-b-sm", !isHome && "border-b border-border")}>
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between gap-6">
          <Link to="/" aria-label="Story Forge" className="flex items-center gap-3">
            <img src={asset("/icon-192.png")} alt="" aria-hidden className="h-8 w-8 rounded-sm" />
            <span className="hidden sm:flex items-baseline gap-1.5 font-display tracking-wide text-2xl">
              <span className="text-fg">Story</span>
              <span className="text-fg-muted">Forge</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            {/* Large screens: input-shaped trigger with ⌘K / Ctrl K hint. */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search (Ctrl K)"
              className={cn(
                "hidden sm:inline-flex items-center gap-2 h-8 w-56 px-3",
                "rounded-sm border border-border bg-surface",
                "text-style-caption text-fg-muted",
                "hover:border-accent/60 hover:text-fg transition-colors",
                "outline-accent outline-offset-2 focus-visible:outline-2",
              )}
            >
              <MagnifyingGlassIcon size={16} weight="light" className="shrink-0" aria-hidden />
              <span className="flex-1 text-left">Search...</span>
              <kbd
                aria-hidden
                className="ml-auto rounded-xs border border-border px-1.5 py-0.5 text-[10px] font-mono leading-none text-fg-muted"
              >
                {isMac ? "⌘K" : "Ctrl K"}
              </kbd>
            </button>
            {/* Small screens: just the search icon. */}
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="sm:hidden"
            >
              <MagnifyingGlassIcon weight="light" />
            </IconButton>
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Continue reading"
              onClick={() => setContinueOpen(true)}
              className="hidden sm:inline-flex"
            >
              <BookOpenTextIcon weight="light" />
            </IconButton>
            <ThemeToggle />
            <Menu>
              <Menu.Trigger
                render={
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label="More options"
                    className="hidden sm:inline-flex"
                  >
                    <ListIcon weight="light" />
                  </IconButton>
                }
              />
              <Menu.Portal>
                <Menu.Positioner align="end">
                  <Menu.Popup>
                    <Menu.Item onClick={() => setBookmarksOpen(true)}>
                      <BookmarkSimpleIcon
                        weight="light"
                        className="inline-block mr-2 align-[-2px]"
                      />
                      Bookmarks
                    </Menu.Item>
                    <Menu.Item onClick={() => setNotesOpen(true)}>
                      <NotebookIcon weight="light" className="inline-block mr-2 align-[-2px]" />
                      Notes
                    </Menu.Item>
                    <Menu.Item onClick={() => setLikesOpen(true)}>
                      <HeartIcon weight="light" className="inline-block mr-2 align-[-2px]" />
                      Likes
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.Item onClick={() => setOfflineOpen(true)}>
                      <CloudArrowDownIcon
                        weight="light"
                        className="inline-block mr-2 align-[-2px]"
                      />
                      Offline reading
                    </Menu.Item>
                    <Menu.Item onClick={() => setSettingsOpen(true)}>
                      <GearIcon weight="light" className="inline-block mr-2 align-[-2px]" />
                      Reader settings
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.Item onClick={hardReload} disabled={!online}>
                      <ArrowClockwiseIcon
                        weight="light"
                        className="inline-block mr-2 align-[-2px]"
                      />
                      Reload for updates
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu>
            <Menu>
              <Menu.Trigger
                render={
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label="Open menu"
                    className="sm:hidden"
                  >
                    <ListIcon weight="light" />
                  </IconButton>
                }
              />
              <Menu.Portal>
                <Menu.Positioner align="end">
                  <Menu.Popup>
                    <Menu.Item onClick={() => setBookmarksOpen(true)}>
                      <BookmarkSimpleIcon
                        weight="light"
                        className="inline-block mr-2 align-[-2px]"
                      />
                      Bookmarks
                    </Menu.Item>
                    <Menu.Item onClick={() => setContinueOpen(true)}>
                      <BookOpenTextIcon weight="light" className="inline-block mr-2 align-[-2px]" />
                      Continue reading
                    </Menu.Item>
                    <Menu.Item onClick={() => setNotesOpen(true)}>
                      <NotebookIcon weight="light" className="inline-block mr-2 align-[-2px]" />
                      Notes
                    </Menu.Item>
                    <Menu.Item onClick={() => setLikesOpen(true)}>
                      <HeartIcon weight="light" className="inline-block mr-2 align-[-2px]" />
                      Likes
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.Item onClick={() => setOfflineOpen(true)}>
                      <CloudArrowDownIcon
                        weight="light"
                        className="inline-block mr-2 align-[-2px]"
                      />
                      Offline reading
                    </Menu.Item>
                    <Menu.Item onClick={() => setSettingsOpen(true)}>
                      <GearIcon weight="light" className="inline-block mr-2 align-[-2px]" />
                      Reader settings
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.Item onClick={hardReload} disabled={!online}>
                      <ArrowClockwiseIcon
                        weight="light"
                        className="inline-block mr-2 align-[-2px]"
                      />
                      Reload for updates
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu>
          </nav>
        </div>
      </header>
      <ScrollArea viewportRef={viewportRef} className="flex-1" scrollRestorationId="app-main">
        <main id="main-content" tabIndex={-1} className="focus-visible:outline-none">
          <Outlet />
        </main>
      </ScrollArea>
      <ContinueReadingDrawer open={continueOpen} onOpenChange={setContinueOpen} />
      <LikesDrawer open={likesOpen} onOpenChange={setLikesOpen} />
      <BookmarksDrawer open={bookmarksOpen} onOpenChange={setBookmarksOpen} />
      <NotesDrawer open={notesOpen} onOpenChange={setNotesOpen} />
      <OfflineDrawer open={offlineOpen} onOpenChange={setOfflineOpen} />
      <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
