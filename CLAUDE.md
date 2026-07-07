# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start dev server at `localhost:4321`
- `npm run build` — production build to `./dist/`
- `npm run preview` — preview the production build locally
- `npx astro check` — type-check `.astro` files and content collections (uses `@astrojs/check`, not run via `npm run astro` since that only forwards to the Astro CLI)
- `./scripts/optimize-images.sh <path>` — compress PNG/GIF/JPG assets in place (requires `pngquant`, `gifsicle`, `imagemagick` via Homebrew)

There is no test suite, linter, or CI config in this repo.

## Architecture

This is an Astro (+ React islands) portfolio site. Static/content pages are `.astro`; interactive bits use React (`@astrojs/react`) sparingly.

### Content model

Each project is one MDX file in `src/content/projects/`, validated by the `projects` collection schema in `src/content/config.ts` (title, description, category, heroImage, tags, `meta` free-form key/value pairs, `bentoSize`, optional custom `sections`). Project pages are rendered by the single dynamic route `src/pages/works/[...slug].astro`, which wraps MDX content in `ProjectLayout.astro`.

### Per-slug hardcoded maps (the main source of friction when adding/changing a project)

Several unrelated files each maintain their own `Record<slug, ...>` map keyed by project slug, and they must be kept in sync by hand — there is no single source of truth:

- `src/pages/works/[...slug].astro` — `HOME_ORDER`: controls next-project banner cycling (only a subset of projects).
- `src/pages/index.astro` — a separate slug allowlist filtering which projects render on the homepage, plus a `heroImages` map of manually imported (for `astro:assets` optimization) hero images per slug, plus one `const xProject = allProjects.find(...)` per featured project used for manual bento column placement.
- `src/layouts/ProjectLayout.astro` — `categoryColors` / `categoryHoverColors` maps (slug → CSS var) for the project page's accent color, plus separate `fallbackColors`/`fallbackHoverColors` maps keyed by the free-form `category` string instead of slug.
- `src/pages/elsewhere.astro` — its own `elsewhereSlugs` allowlist, `categoryColors`, and `imageScales` maps for the non-homepage "side quest" projects.

When adding a new project or renaming a slug/category, grep for the slug across these files rather than assuming one config location.

### Category system

Four category colors are defined as CSS vars in `src/styles/global.css` (`--category-hardware-ux`, `--category-web-ux`, `--category-mobile-ux`, `--category-spatial-xd`, each with a `-hover` variant). Category *labels* used in content frontmatter (e.g. `thinking`, `embodied`, `spatial`, `strategy`) don't always match these var names 1:1 — `ProjectLayout.astro`'s `fallbackColors` map is the translation layer between old category strings and the current CSS vars.

### Asset workflow

Documented in `ASSET_MANAGEMENT.md`. Summary: all project images live in `public/assets/projects/<slug>/` and are referenced by string path in MDX (`<FullWidthImage src="/assets/projects/.../x.png" />`); only homepage *hero* images additionally get duplicated into `src/assets/projects/<slug>/` so they can be imported and optimized via `astro:assets` in `index.astro`. Optimize new assets with `scripts/optimize-images.sh` before committing.

### Global layout shell

`src/layouts/Layout.astro` is the outer HTML shell used by every page (fonts, meta tags, analytics, `<ViewTransitions />`, Lenis smooth-scroll init, `CustomCursor`, `TypographyInspector`). It exposes a `sidebar` named slot plus a default slot. `ProjectLayout.astro` (used by all project pages) and page-level layouts build on top of it rather than duplicating the `<head>`/shell.

### Dev-only typography inspector

`TypographyInspector.astro` is a live in-browser style editor (hold Ctrl/Cmd + click any text element) for experimenting with font/size/weight/spacing. It persists overrides via two dev-only endpoints implemented as a custom Vite middleware plugin directly in `astro.config.mjs` (`devSaveTypographyPlugin`, handling `/api/save-typography` and `/api/load-typography`) — not as Astro API routes under `src/pages/api/` (that directory is empty). Saved overrides are written to `src/styles/typography-inspector-overrides.css`, imported at the top of `global.css`. This only works in `astro dev`, not in production builds.

### Fonts

Font family CSS vars (`--font-title`, `--font-sans`, `--font-mono`) are defined in `src/styles/global.css` and map to Geist, Google Sans, and Geist Mono respectively, loaded via `<link>` tags in `Layout.astro` (Google Fonts for Geist/Geist Mono/Bricolage Grotesque/Inter, jsDelivr `@fontsource/google-sans` for specific weights of Google Sans — currently only 300/400/500/700 are loaded, so requesting `font-weight: 800` on a Google Sans element will not actually render as 800). Bricolage Grotesque is used directly (not via a CSS var) for several large display headings (e.g. project H2s, footer contact message).

## Documentation sync rule

`docs/Developer Documentation.html` and `docs/Design System.html` are hand-maintained reference docs for this codebase. Whenever you make a large or structural change (new architecture pattern, new per-slug map, new category, new component convention, changed asset/font workflow, etc.), update the relevant section of `docs/Developer Documentation.html` (or `Design System.html` for visual/design-token changes) in the same change — don't leave the docs describing stale behavior.
