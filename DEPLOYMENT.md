# Deployment

The site deploys to **GitHub Pages** through `.github/workflows/deploy.yml`:

```text
push to main → npm ci → validate + build → check links → tests → upload dist/ → deploy to Pages
```

Pull requests run everything except the deploy.

## First-Time Setup

1. Create an empty GitHub repository, for example `vibe-assist-knowledge`, and push this repository:
   ```bash
   git remote add origin https://github.com/<you>/vibe-assist-knowledge.git
   git push -u origin main
   ```
2. In the repository, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Push to `main`, or run the workflow manually from the *Actions* tab. The deploy job prints the site URL.

### URL and Base Path

The workflow reads the Pages URL from `actions/configure-pages` and passes it to Astro:

| Hosting | `SITE_URL` | `BASE_PATH` | Example page |
|---|---|---|---|
| Project site | `https://<you>.github.io` | `/vibe-assist-knowledge` | `https://<you>.github.io/vibe-assist-knowledge/java-hashmap` |
| Custom domain | `https://knowledge.example.com` | `/` | `https://knowledge.example.com/java-hashmap` |

You can override both with repository **Variables** (`Settings → Secrets and variables → Actions → Variables`): `SITE_URL`, `BASE_PATH`.

To reproduce a project-site build locally:

```bash
SITE_URL=https://<you>.github.io BASE_PATH=/vibe-assist-knowledge npm run ci
```

(In Git Bash on Windows, prefix with `MSYS_NO_PATHCONV=1` so `/vibe-assist-knowledge` is not rewritten into a Windows path.)

### Custom Domain (Recommended)

A custom domain puts `robots.txt` at the domain root and gives cleaner, shorter URLs for Copilot:

1. Add a `CNAME` DNS record pointing `knowledge.example.com` to `<you>.github.io`.
2. Settings → Pages → Custom domain → `knowledge.example.com`, then enable **Enforce HTTPS**.
3. Set the repository variables `SITE_URL=https://knowledge.example.com` and `BASE_PATH=/`.
4. Add `public/CNAME` containing the domain, so manual deployments keep it.

Avoid redirects from the configured domain to a different domain. Copilot ignores content behind a cross-domain redirect.

## Getting Indexed by Bing (Required for Copilot)

Copilot's public-website knowledge uses **Grounding with Bing Search**. Pages must be in Bing's index.

1. Open **Bing Webmaster Tools** → add your site → verify it (DNS record, meta tag, or import from Google Search Console).
2. Submit `https://<your-site>/sitemap.xml`.
3. Optionally enable **IndexNow** to notify Bing of changed URLs after each deploy.
4. Check coverage with queries like `site:<your-site> redis caching`.

Indexing can take days. The sitemap's `lastmod` values come from each article's `updated` field, so bump `updated` when you make meaningful changes.

## Connecting the Copilot Agent

See [docs/copilot-agent.md](docs/copilot-agent.md), also published at `/copilot-agent`. In summary: create an agent in Microsoft 365 Copilot's Agent Builder (or Copilot Studio), add the deployed site URL as a **public website** knowledge source, and paste the provided instructions.

## Rollback

Every deploy is a commit. Revert the commit on `main` and the previous version redeploys. You can also re-run an earlier successful workflow run from the Actions tab.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Unstyled pages or 404s on a project site | `BASE_PATH` not set; check the "Detect Pages URL" step output |
| Deploy job fails with a permissions error | Pages source must be "GitHub Actions"; the workflow needs `pages: write` and `id-token: write` (already set) |
| Build fails on slug collision | Rename the article slug; hubs and reserved pages own their slugs |
| Copilot doesn't find a page | Not in Bing's index yet; check Bing Webmaster Tools URL inspection |
