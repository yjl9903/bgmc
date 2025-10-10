# Repository Guidelines

## Project Structure & Module Organization

The monorepo is managed with pnpm workspaces and Turbo. Core packages live under `packages/` (`bgmc`, `bgmd`, `bgmt`, `bgmx`, `tmdbc`); each exposes its CLI in `src/` and keeps tests in `test/`. Shared datasets sit in `data/`, while release patches and helper scripts live in `patches/` and `scripts/` respectively. Root configs (`tsconfig.json`, `turbo.json`, `.prettierrc`) apply across all packages to keep builds, linting, and formatting aligned.

## Build, Test, and Development Commands

- `pnpm install` — install workspace dependencies (Node 20.8+ required).
- `pnpm dev` — run package-level `dev` tasks in parallel via Turbo when a package defines them.
- `pnpm build` — execute `tsdown`-based builds for every package and produce outputs in `dist/`.
- `pnpm typecheck` — run TypeScript checks, ensuring generated `.d.ts` remain valid.
- `pnpm test:ci` — execute Vitest suites (`vitest --run`) after build and typecheck.
- `pnpm <script>` or `pnpm -C packages/<name> <script>` — target package-specific commands (example: `pnpm -C packages/bgmc test`).

## Coding Style & Naming Conventions

Code is authored in TypeScript (ESM). Prettier enforces two-space indentation, semicolons, single quotes, and a 100-character line width; run `pnpm format` before sending changes. Package directories and published artifacts stay kebab-cased (`bgmc`, `tmdbc`), and source files prefer descriptive camelCase or PascalCase names that mirror exported symbols. Keep CLI entry points in `src/cli.ts` and emit build artifacts only to `dist/`.

## Testing Guidelines

Vitest powers all unit and integration coverage; place specs beside implementation in `test/*.test.ts`. Ensure new suites pass under `pnpm test:ci`, which Turbo wires to upstream `build` and `typecheck` tasks. Mock external services where feasible and document fixtures inside the package’s `test/` folder. Aim to keep high-level CLI behaviours covered so releases triggered through `pnpm release:<pkg>` remain verifiable.

## Commit & Pull Request Guidelines

This repo follows Conventional Commits (`type(scope): message`), as seen in recent history (`fix(deps): …`, `chore: …`). Write focused commits with imperative summaries and include a scope when touching a single package (`feat(bgmx): add schedule fetcher`). PRs should describe intent, link issues, note any release impact, and include screenshots or sample command output for user-facing changes. Before requesting review, run `pnpm format`, `pnpm typecheck`, and `pnpm test:ci`; mention the results in the PR body.
