// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import rehypeBaseLinks from './src/lib/rehype-base-links.mjs';

// SITE_URL / BASE_PATH are injected by the GitHub Pages workflow
// (actions/configure-pages). Locally they fall back to a placeholder domain,
// which only affects canonical URLs, the sitemap and the feed.
const site = process.env.SITE_URL || 'https://knowledge.example.com';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  // Shallow, extension-less URLs: /java-hashmap -> dist/java-hashmap.html.
  // GitHub Pages serves foo.html for /foo without a redirect, so the public
  // URL never needs a trailing slash or a nested path.
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  markdown: {
    processor: unified({ rehypePlugins: [[rehypeBaseLinks, { base }]] }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
  // No client framework integrations on purpose: every page is plain HTML.
  integrations: [],
});
