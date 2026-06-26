# Repository Guidelines

## Project Structure & Module Organization

Story Forge is a Vite+ React PWA for reading static Markdown novels. App code lives in `src/`. Route files are under `src/routes/` and use TanStack Router file-based routing; do not edit generated `src/routeTree.gen.ts`. Shared UI is split by purpose in `src/components/` (`primitives`, `library`, `reader`, `shell`, `thematic`, `volume`). Domain logic lives in `src/lib/`. Custom build plugins live in `vite-plugins/`.

Novel content is served as static Markdown from `public/novels/<novel>/chapters/<chapter>/NN.md`. Keep page filenames zero-padded so lexical sorting stays correct. Static icons and web assets live in `public/`.

## Build, Test, and Development Commands

- `vp install`: install dependencies with the project package manager.
- `vp dev`: start the local development server.
- `vp check`: run formatting, linting, and type checks.
- `vp check --fix`: apply automatic formatting and lint fixes; this also runs from the staged hook.
- `vp test`: run Vitest. The suite currently has no test files.
- `vp build`: run the production build.
- `vp preview`: serve the built app locally.

Use `pnpm` through Vite+ unless a task clearly needs a direct package-manager command.

## Coding Style & Naming Conventions

Write TypeScript and React with the existing style: two-space indentation, double quotes, semicolons, and named exports for shared components and helpers. Prefer small, typed modules. Use `@src/*` and `@app/*` aliases, and keep alias changes synchronized between `vite.config.ts` and `tsconfig.app.json`.

For chapter prose, separate paragraphs and scene breaks with blank lines only. Do not use Markdown rules such as `---`, and avoid dash characters when punctuation or rewording is clearer.

## Testing Guidelines

Add focused tests when changing behavior. Use Vitest names such as `*.test.ts` or `*.test.tsx`, placed near the code under test unless shared fixtures are needed. Run `vp check` and `vp test` before marking code changes done. For UI, routing, offline, or PWA behavior, also verify the flow in a browser.

## Commit & Pull Request Guidelines

This repository has no commit history yet, so use Conventional Commits going forward: `feat(scope): add reader setting`, `fix(pwa): align cache url`. Keep each commit to one logical change.

Pull requests should include a short summary, linked issue when one exists, screenshots for visible UI changes, and a test plan with exact commands or browser checks. CI builds with Node 22, runs `vp check`, and deploys `main` to GitHub Pages with `BASE_URL` set to the repository path.
