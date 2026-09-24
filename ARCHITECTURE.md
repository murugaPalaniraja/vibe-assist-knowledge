# Architecture

## Goals

1. Serve high-density engineering knowledge as **static HTML** that search engines, and therefore Copilot's Bing-grounded knowledge, can crawl and quote.
2. Organise every concept around **Understand / Learn / Review / Apply / Prompt** for developers supervising coding agents.
3. Stay trivial to operate: Git as the CMS, GitHub Actions as the build system, GitHub Pages as hosting.

## System Context

```text
 vibe-assist-ingestion ──(markdown + provenance)──▶ content/ingested/
 human authors ─────────(markdown + frontmatter)──▶ content/<category>/, content/prompts/
                                                        │
                                              npm run build (Astro, static)
                                                        ▼
                                  dist/  (HTML + one CSS file, no client JS bundles)
                                                        │  GitHub Actions
                                                        ▼
                                                  GitHub Pages
                                                        │  crawl (sitemap.xml, internal links)
                                                        ▼
                                                   Bing index
                                                        │  grounding
                                                        ▼
                                             Copilot "Vibe-Assist" agent
```

## Technology Choices

| Choice | Why |
|---|---|
| **Astro 7** (static output) | Renders Markdown content collections to plain HTML with **zero JS by default**, typed frontmatter schemas (Zod), and endpoints for sitemap, robots and RSS without plugins. Hugo would also work; Astro was chosen for schema validation and TypeScript-level checks on content. |
| Markdown + YAML frontmatter | Human-editable, diff-friendly, easy for the ingestion pipeline to generate. |
| `node:test` + small scripts | Tests and link checks need no extra dependencies. |
| GitHub Actions + Pages | Free, no servers, deploys on push. |

Dependencies: `astro`, `@astrojs/markdown-remark` (for the base-path rehype plugin), and `yaml` (dev, used by validation scripts). Nothing else.

## Repository Layout

```text
content/                  knowledge articles by category + prompts/ (authoring layout only)
  ingested/               owned by vibe-assist-ingestion (created on first publish)
docs/                     demo + Copilot guide (also rendered as site pages)
src/
  content.config.ts       Zod schemas for the "knowledge" and "prompts" collections
  data/taxonomy.mjs       categories, technologies, prompt categories, reserved slugs
  lib/site.ts             href()/absoluteUrl(), route table with collision detection
  lib/inventory.ts        list of every public page → sitemap, RSS, llms.txt, search index
  lib/rehype-base-links.mjs  prefixes Markdown links with the deploy base path
  components/             ArticleView, PromptView, HubView, ArticleCards
  layouts/BaseLayout.astro  <head> SEO: title, description, canonical, OG, JSON-LD, breadcrumbs
  pages/[slug].astro      ONE dynamic route for articles, prompts, category and technology hubs
  pages/*.astro|*.ts      home, knowledge, prompts, checklists, demo, about, search, endpoints
scripts/                  validate-content.mjs, check-links.mjs
tests/site.test.mjs       build-output tests
```

## URL Design: Shallow by Construction

Copilot public-website knowledge sources accept a URL of **at most two path levels** and retrieve pages through Bing. Deep URLs such as `/java/collections/hashmap` are fragile for that and add nothing for readers. So:

- **Every page is a single path segment**: `/java-hashmap`, `/spring-security-jwt`, `/backend`, `/java`, `/security-review-prompt`.
- The **folder in `content/` is not part of the URL**. The slug comes from frontmatter (`slug` or `id`).
- Hierarchy is expressed through **navigation and structured data**: breadcrumbs (`Home › Knowledge › Security › …`, also emitted as `BreadcrumbList` JSON-LD), category hubs, technology hubs, related links and backlinks.
- `build.format: 'file'` emits `dist/java-hashmap.html`. GitHub Pages serves it at `/java-hashmap` **with no redirect**, so the canonical URL, the sitemap URL and the served URL are identical. `trailingSlash: 'never'` keeps links consistent.
- `src/pages/[slug].astro` builds a route table and **throws on any slug collision** (article vs prompt vs hub vs reserved page). For example, the Docker *article* is `/docker-containers` so that the Docker *hub* can be `/docker`.

## Indexability Decisions

| Requirement | Implementation |
|---|---|
| Content in HTML, no client rendering | Astro static output; tests assert the summary, every heading and the prompt templates appear in the HTML; a test fails if any client JS bundle is emitted |
| Unique title / meta description / canonical | `BaseLayout.astro`; descriptions are validated at ≤170 chars |
| One H1, semantic H2/H3 | The layout renders the title as the only H1; validation rejects `#` in bodies |
| Sitemap from the content collection | `src/pages/sitemap.xml.ts` ← `pageInventory()`; `lastmod` from `updated` |
| robots.txt | `src/pages/robots.txt.ts` (allow all + sitemap pointer) |
| Structured data | `TechArticle`, `CollectionPage`, `WebSite` + `SearchAction`, `BreadcrumbList` |
| Feed | `rss.xml` (RSS 2.0, 50 newest items) |
| Internal linking | related, backlinks, hub pages, checklist aggregation, footer |
| Thin/derived pages | ingested *excerpt* notes get `index: false`, so they are `noindex, follow` and left out of the sitemap |
| LLM-friendly map | `/llms.txt` |

## Search

Search is **optional and client-side only** (`/search`). It fetches `search-index.json`, which holds title, URL, summary and tags, **never article bodies**, and is tested to stay under 100 KB. The search page is `noindex`. Discovery for Copilot relies on Bing, not on this search.

## Content Model

Two collections, defined in `src/content.config.ts`:

- **knowledge**: `id`, `title`, `summary`, `category`, `technology[]`, `concepts[]`, `difficulty`, `tags[]`, `vibe{understand,learn,review,apply,prompt}`, `review_checklist[]`, `related[]`, `prompts[]`, `sources[]`, `origin`, `provenance`, `index`, `draft`, `updated`. The prose sections live in the Markdown body. **Checklist, prompt links, related concepts and sources are rendered by the layout from frontmatter**, which keeps them machine-readable and lets `/checklists` aggregate them.
- **prompts**: `id`, `title`, `category` (16 engineering task types), `purpose`, `inputs[]`, `checks[]`, `output_format[]`, `template`, `related[]`.

Validation happens in two layers: Zod at build time (types, enums, URLs), and `scripts/validate-content.mjs` (cross-file rules such as unknown references, collisions, forbidden headings, and provenance required for ingested content).

## Knowledge Repository ≠ Training Dataset

This repository exists for **retrieval and grounding**. Nothing here is used to train or fine-tune a model. The ingestion repository collects and transforms knowledge. The Copilot agent's LLM reads pages at question time.

## Known Limitations

- **Bing controls discovery.** New pages are useless to Copilot until indexed, and ranking cannot be forced. Submit the sitemap in Bing Webmaster Tools (see DEPLOYMENT.md).
- **GitHub Pages project sites** (`user.github.io/repo`) cannot serve `robots.txt` at the domain root. A custom domain fixes this.
- **External links are not checked** in CI, to keep builds offline and deterministic. Run a periodic external link check if needed.
- **Frontend and Cloud categories** exist in the taxonomy but have no articles yet. Hubs appear automatically when the first article is added.
- Search is substring-based, which is fine for dozens or hundreds of pages. Consider Pagefind if the site grows into thousands of pages.

## Future Work (Documented Only, Not Implemented)

Vector RAG and embeddings, a knowledge graph, LLM-based extraction in ingestion, automatic source discovery, GitHub repository analysis, IDE and VS Code integration, Copilot Studio actions, MCP server integration, personal project context, automated agent-result analysis, prompt evaluation and prompt versioning.
