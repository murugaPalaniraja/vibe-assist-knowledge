# Content Guide

The goal is **high information density for one concept per page**. A Copilot agent retrieves only a few pages per question, so each page must stand on its own.

## File Location and URL

- Articles: `content/<folder>/<slug>.md`. The folder is only for authors (`programming`, `backend`, `security`, `databases`, `devops`, `architecture`, `testing`, `ai`, `frontend`).
- Prompt patterns: `content/prompts/<slug>.md`.
- Ingested notes: `content/ingested/`. This folder is **owned by vibe-assist-ingestion**, so don't hand-edit it.
- The public URL is always `/<slug>`, where the slug is lowercase kebab-case and unique site-wide. It must not equal a category slug (`backend`), a technology slug (`java`, `docker`) or a reserved page (`prompts`, `search`, …). `npm run validate` enforces this.

Choose slugs people would search for: `spring-security-jwt`, `python-generators`, `redis-caching`.

## Article Frontmatter

```yaml
---
id: redis-caching                      # = slug = file name
title: Redis Caching Patterns and Pitfalls
description: ≤160 chars, used as the meta description (quote it if it contains ": ")
summary: 1–3 sentences answering "what is it and why does it matter". Shown as the lede.
category: databases                    # see src/data/taxonomy.mjs
technology: [Redis, Spring Boot, Java] # names from the taxonomy; each gets a hub page
concepts: [cache-aside, TTL, cache invalidation]
difficulty: intermediate               # beginner | intermediate | advanced
tags: [redis, caching, performance]
vibe:                                  # one or two sentences each
  understand: …
  learn: …
  review: …                            # what to inspect in agent-written code
  apply: …
  prompt: …                            # what to ask the coding agent
review_checklist:                      # plain strings or {item, why}
  - item: Cache key correctness
    why: Keys include every input that changes the result.
related: [database-transactions]       # slugs of articles or prompts
prompts: [redis-cache-review-prompt]   # slugs of prompt patterns
sources:
  - title: Redis Documentation
    url: https://redis.io/docs/latest/
    license: optional
updated: 2026-09-24
---
```

YAML gotchas: quote values that start with `@` (`"@Transactional"`) or contain `": "`.

## Body Structure

Start at `##` (the layout renders the H1). Use the sections that carry information and **skip the rest**. Empty or filler sections hurt quality.

Recommended order:

```text
## What is X?
## Why X is Used
## How X Works
## <Framework> Flow / Important Components
## Implementation Concepts
## Common Mistakes              ← especially mistakes coding agents make
## Security Considerations
## Performance Considerations
## Testing
## Debugging
## Code Example
## When to Use It
## When Not to Use It
```

Do **not** write these sections in the body. The layout generates them from frontmatter: *Coding-Agent Review Checklist*, *Master Prompt Patterns*, *Related Concepts*, *Sources*.

## Writing for Retrieval

- Put the most important definition in the **summary** and the first paragraph. Retrieval snippets are short.
- Use **descriptive headings** containing the concept name ("How JWT Authentication Works", not "Details").
- Use tables for comparisons and lists for checks, so an LLM can quote them precisely.
- Repeat key context on each page instead of relying on "see the previous page".
- Use site-absolute internal links: `[Redis caching](/redis-caching)`. They are rewritten for the deploy base path automatically.
- Keep code examples short, correct and idiomatic for current versions.

## Writing Review Checklists

Each item must be **checkable against a diff**:

- ✅ "Every write path that changes cached data evicts it after commit"
- ❌ "Caching is done well"

Aim for 6–12 items, ordered by risk. Add `why` where the reason is not obvious. Reviewers must be able to classify each finding as **Confirmed / Potential risk / Needs verification**.

## Writing Prompt Patterns

Prompt patterns are engineering work orders, not chat prompts. Required fields: `purpose`, `inputs` (placeholders used in the template as `{{name}}`), `checks`, `output_format`, `template`. Templates must:

- demand evidence (`file:line`, command output),
- forbid claiming bugs without evidence,
- use the Confirmed / Potential risk / Needs verification labels,
- say whether the agent may change code in this step.

## Sources and Licensing

Cite official documentation, specifications (RFCs) and well-known references in `sources`. Write explanations in your own words. Never paste documentation text verbatim. Ingested content carries a `provenance` block and a visible attribution banner.

## Before Opening a PR

```bash
npm run ci
```
