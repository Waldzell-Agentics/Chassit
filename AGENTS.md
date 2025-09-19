# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by `pnpm` and `turbo`.
- Apps and libraries live under `packages/`:
  - `packages/api`: Express/Vite-node API, Drizzle ORM, Vitest.
  - `packages/web`: Vite + React UI, Tailwind.
  - `packages/components`, `packages/shared`, `packages/configs`: shared libraries and config.
- `srcbook/`: CLI package (`bin/cli.mjs`) that runs the local app.
- `docs/`: architecture notes; `.changeset/`: release metadata.

## Build, Test, and Development Commands
- Install: `pnpm install` (Node 18+, `.nvmrc` recommends 22.x).
- Dev (API + Web via Turbo): `pnpm dev` → visit `http://localhost:5173`.
- Build all: `pnpm build` (artifacts in each package’s `dist/`).
- Lint all: `pnpm lint` • Format: `pnpm format` • Type-check: `pnpm run check-types`.
- Tests: `pnpm test` (runs package tests via Turbo/Vitest).
- Package-specific: `pnpm --filter @srcbook/api dev` (or `build`, `test`, etc.).
- Database (API): `pnpm generate` (Drizzle), `pnpm migrate`.

## Coding Style & Naming Conventions
- TypeScript, ESM modules (`.ts/.mts`). Two-space indent, `semi: true`, `singleQuote: true`, `printWidth: 100` (Prettier).
- ESLint extends `@srcbook/configs`; zero warnings enforced in CI.
- File names: kebab-case; React components PascalCase; tests `*.test.mts`.

## Testing Guidelines
- Framework: Vitest (primarily in `packages/api`).
- Location: `packages/<pkg>/test/` or co-located next to source.
- Naming: `*.test.ts` or `*.test.mts`.
- Run: `pnpm test` (root) or `pnpm --filter @srcbook/api test`.

## Commit & Pull Request Guidelines
- Commits: concise, imperative subject; reference issues (`#123`) when relevant.
- Changesets: run `pnpm changeset` in PRs; prefer patch/minor entries.
- PRs: include clear description, linked issues, screenshots for UI changes, and notes on tests/migrations. Keep diffs focused.

## Security & Configuration Tips
- Env vars: see `turbo.json` (`VITE_SRCBOOK_API_ORIGIN`, etc.) and `packages/web/.env.*`.
- Local data: SQLite at `~/.srcbook/srcbook.db`.
- Analytics: disable with `SRCBOOK_DISABLE_ANALYTICS=true`.
- After Node version switches, run `pnpm rebuild -r` (native deps like `better-sqlite3`).

