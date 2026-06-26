# Story Forge

An open repository for AI-crafted stories, novels, and fictional worlds. A place
where imagination is forged into narratives.

Story Forge is a text-only web reader built to hold many works. Each novel lives
as Markdown and is served from the same app: clean typography, per-volume chapter
lists, reading progress, bookmarks, notes, and offline support via a service
worker. It is text only, with no illustrations and no audio.

## Novels

The library can hold multiple novels side by side. The first one is:

### Nhất Phàm Ký

A cultivation (tiên hiệp) novel: the story of Tần Mặc, a herb-gathering youth from
the foot of Đại Mang Sơn who steps onto the path of immortality. The current
published volume is:

- **Quyển 1 · Sơn Thôn Vấn Đạo** (72 chapters)

## Content

Each novel keeps its chapters as Markdown under `public/novels/<novel>/chapters/`,
one prose page per chapter file. The Vite plugin `chapterManifestPlugin` scans the
tree and serves `chapter-manifest.json`, so adding or editing a chapter `.md` only
needs a redeploy of the static files, with no JS rebuild.

To add a novel, a volume, or chapters: drop the Markdown pages under
`public/novels/<novel>/chapters/`, register each volume in
`src/routes/_app/library/-volumes/` (see `quyen-1.ts`), then list it in
`-library/index.ts` and `-volumes/index.ts`.

Prose style for chapter text: separate paragraphs and scene beats with a blank
line only (never `---`), and avoid the long dash `—` (use a comma, a period, or a
reworded sentence). See `CLAUDE.md` for the full conventions.

## Stack

Built with [Vite+](https://viteplus.dev) (the `vp` CLI), React 19, TanStack
Router (file-based routing), Tailwind CSS v4, Dexie (IndexedDB) for
progress/bookmarks/notes, and `vite-plugin-pwa` for offline reading.

## Develop

```bash
vp install   # install dependencies
vp dev       # start the dev server
vp check     # format, lint, type check
vp build     # production build
```

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with
`BASE_URL=/<repo-name>/` and publishes to GitHub Pages.
