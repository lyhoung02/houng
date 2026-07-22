# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — dev server at http://localhost:3000
- `npm run build` — static export to `out/` (this is the deploy artifact)
- `npm run lint` — ESLint

There are no tests.

## Stack

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4. Per AGENTS.md, this Next.js version has breaking changes — consult `node_modules/next/dist/docs/` before writing Next-specific code.

The site is a **fully static export** (`output: "export"` in [next.config.ts](next.config.ts), unoptimized images, trailing slashes). Do not add API routes, server actions, or anything requiring a Node server. Deploys to Cloudflare Pages ([wrangler.toml](wrangler.toml)) and AWS Amplify ([amplify.yml](amplify.yml)), both serving `out/`.

## Architecture

This is a personal portfolio site. The pattern for every route:

- Each `src/app/<route>/page.tsx` is a thin server component: it exports `metadata` and renders one section component from `src/components/` wrapped in `SiteShell`.
- [SiteShell.tsx](src/components/SiteShell.tsx) (client) provides Nav, Footer, ScrollToTop, and ChatWidget around the page content.
- Section components (`Hero`, `Projects`, `Experience`, …) are client components that pull text from i18n and content from the data layer.

To add a page: create the section component, then a `page.tsx` that wraps it in `SiteShell`, and add it to `Nav.tsx`.

### Content vs. text

- **Content data** (projects, experience, skills, education, archive) lives in [src/lib/portfolio-data.ts](src/lib/portfolio-data.ts) as typed arrays. Edit portfolio content there, not in components.
- **UI strings** live in [src/lib/i18n/messages.ts](src/lib/i18n/messages.ts) with English (`en`) and Khmer (`km`) variants. `Messages = typeof en`, so any key added to `en` must also be added to `km` or the file won't typecheck. Components read strings via `const t = useT()` from [LanguageProvider.tsx](src/components/providers/LanguageProvider.tsx) (`useLanguage()` returns the full context — lang, setLang, `t`).

### Providers (both client-side, localStorage-persisted)

- [ThemeProvider.tsx](src/components/providers/ThemeProvider.tsx) — light/dark/system via a class on `<html>`, key `houng.theme`. `themeBootScript` is inlined in [layout.tsx](src/app/layout.tsx) to prevent flash-of-wrong-theme; keep it in sync with the provider logic.
- [LanguageProvider.tsx](src/components/providers/LanguageProvider.tsx) — `en`/`km`, key `houng.lang`. Also toggles the `km` class on `<html>` to switch to the Noto Sans Khmer font.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
