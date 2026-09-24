# Vibe Knowledge (vibe-assist-knowledge)

A static, search-engine-indexable software-engineering knowledge site for **Vibe-Assist**, an assistant that helps developers **understand, review and prompt** the work of AI coding agents.

The site is the **public website knowledge source** for a Microsoft Copilot agent. Copilot finds pages through Bing web search at question time, so every design choice here optimises for **one focused, crawlable HTML page per concept at a short URL**.

```text
User ─▶ Copilot agent ─▶ Bing-grounded search over this site ─▶ relevant pages ─▶ LLM ─▶ Vibe-Assist answer
```

## What's Inside

| Area | URL | Source |
|---|---|---|
| 28 curated knowledge articles (Java, Python, Spring Boot, databases, DevOps, architecture, testing, AI) + 10 ingested reference notes | `/java-hashmap`, `/spring-security-jwt`, … | `content/<category>/*.md` |
| 18 engineering prompt patterns (Master Prompt Library) | `/prompts`, `/agent-change-review-prompt`, … | `content/prompts/*.md` |
| Coding-agent review checklists (aggregated from articles) | `/checklists` | article frontmatter |
| Category and technology hubs | `/backend`, `/java`, `/redis`, … | generated from taxonomy |
| Worked demo (JWT + Redis + PostgreSQL) | `/vibe-assist-demo` | `docs/demo-scenario.md` |
| Copilot agent setup guide | `/copilot-agent` | `docs/copilot-agent.md` |
| `sitemap.xml`, `robots.txt`, `rss.xml`, `llms.txt`, `search-index.json` | root | generated |

Every article follows the Vibe-Assist lenses **Understand → Learn → Review → Apply → Prompt**, and most carry a structured **coding-agent review checklist**.

## Quick Start

Requires Node.js 20+ (CI uses 22).

```bash
npm install
npm run dev          # http://localhost:4321 with live reload
npm run build        # validate content + build static site into dist/
npm run check-links  # verify every internal link and #fragment in dist/
npm test             # 268 checks against dist/ (titles, H1, canonical, sitemap, content-in-HTML, …)
npm run ci           # all of the above, the same as GitHub Actions
npm run preview      # serve dist/ locally
```

## Adding Knowledge

1. Create `content/<category>/<slug>.md`, copying the frontmatter of an existing article (see [CONTENT_GUIDE.md](CONTENT_GUIDE.md)).
2. `npm run validate` catches schema errors, unknown `related` slugs, slug collisions and misplaced headings.
3. `npm run build`. The page, its hub listings, the sitemap, the feed and the search index all update automatically.

Content can also arrive from the sibling **vibe-assist-ingestion** repository, which writes provenance-tagged reference notes into `content/ingested/`.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md): design, URL strategy, indexability decisions, limitations
- [CONTENT_GUIDE.md](CONTENT_GUIDE.md): schema, section structure, writing checklists and prompts
- [CONTRIBUTING.md](CONTRIBUTING.md): workflow and quality bar
- [DEPLOYMENT.md](DEPLOYMENT.md): GitHub Pages, custom domain, Bing indexing, Copilot configuration
- [docs/copilot-agent.md](docs/copilot-agent.md): agent instructions to paste into Copilot
- [docs/demo-scenario.md](docs/demo-scenario.md): the end-to-end demonstration

## What This Repository Is Not

It is **not a training dataset** and there is **no model training**, **no vector database** and **no backend**. It's a static site that an LLM agent retrieves from at question time.
