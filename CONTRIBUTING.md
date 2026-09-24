# Contributing

## Workflow

1. Create a branch.
2. Add or edit Markdown under `content/` following [CONTENT_GUIDE.md](CONTENT_GUIDE.md).
3. Run `npm run dev` to review the page, then `npm run ci`.
4. Open a pull request. CI validates, builds, checks links and runs the tests. Merging to `main` deploys.

## Quality Bar

- **Accurate and current.** Verify version-specific statements against official docs and cite them in `sources`.
- **One concept per page**, with a clear summary and descriptive headings.
- **Useful to someone reviewing agent-written code.** Every substantial article should include common mistakes and a review checklist.
- **No filler sections, no copied documentation, no marketing language.**
- **Honest risk language.** Checklists and prompts distinguish Confirmed / Potential risk / Needs verification.

## Code Changes

- Keep the site static. Don't add client-side frameworks or runtime data fetching for content.
- New pages must render content in HTML and pass `npm test`.
- New taxonomy entries go in `src/data/taxonomy.mjs`. Hub pages appear automatically.
- Keep dependencies minimal and justify any addition in the PR.

## Ingested Content

`content/ingested/` is written by `vibe-ingest publish`. To change an ingested note, change the source manifest or pipeline in **vibe-assist-ingestion** and republish. Manual edits are overwritten.
