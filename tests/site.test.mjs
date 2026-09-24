// Site tests: run against the built output in dist/ (npm run build first).
// Uses only node:test so the test suite adds no dependencies.
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { loadContent, validateContent, bodyHeadings } from '../scripts/lib/content.mjs';
import { checkLinks, DIST, resolvePath } from '../scripts/check-links.mjs';

const read = (rel) => readFileSync(join(DIST, rel), 'utf8');
const decode = (s) => s
  .replace(/<[^>]+>/g, '')
  .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();
const stripMd = (s) => s.replace(/`([^`]*)`/g, '$1').replace(/\*\*([^*]*)\*\*/g, '$1').replace(/\*([^*]*)\*/g, '$1')
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim();

const entries = loadContent().filter((e) => e.data && !e.data.draft);
const articles = entries.filter((e) => e.kind === 'article');
const prompts = entries.filter((e) => e.kind === 'prompt');

before(() => {
  assert.ok(existsSync(join(DIST, 'index.html')), 'dist/ is missing — run `npm run build` before `npm test`');
});

describe('content', () => {
  test('passes cross-file validation (schema basics, references, headings)', () => {
    const { errors } = validateContent(loadContent());
    assert.deepEqual(errors, []);
  });

  test('has no duplicate slugs across articles and prompts', () => {
    const slugs = entries.map((e) => e.slug);
    assert.equal(new Set(slugs).size, slugs.length);
  });

  test('ships a meaningful sample set', () => {
    assert.ok(articles.length >= 25, `expected ≥25 articles, got ${articles.length}`);
    assert.ok(prompts.length >= 16, `expected ≥16 prompt patterns, got ${prompts.length}`);
    const withChecklist = articles.filter((a) => (a.data.review_checklist ?? []).length > 0);
    assert.ok(withChecklist.length >= 20, 'most articles should carry a coding-agent review checklist');
  });
});

describe('generated pages', () => {
  for (const e of entries) {
    describe(`/${e.slug}`, () => {
      let html;
      before(() => {
        const file = resolvePath(DIST, '/' + e.slug);
        assert.ok(file, `no HTML generated for /${e.slug}`);
        html = readFileSync(file, 'utf8');
      });

      test('is generated at a shallow URL', () => {
        assert.ok(existsSync(join(DIST, `${e.slug}.html`)));
      });

      test('has a <title>, meta description and canonical URL', () => {
        assert.match(html, /<title>[^<]{5,}<\/title>/);
        const desc = /<meta name="description" content="([^"]+)"/.exec(html);
        assert.ok(desc && desc[1].length >= 40, 'meta description missing or too short');
        const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html);
        assert.ok(canonical, 'canonical missing');
        assert.match(canonical[1], new RegExp(`^https?://[^/]+(/[^/]+)*/${e.slug}$`));
      });

      test('has exactly one H1 containing the title', () => {
        const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
        assert.equal(h1s.length, 1);
        assert.equal(decode(h1s[0][1]), e.data.title);
      });

      test('has Open Graph and valid JSON-LD structured data', () => {
        assert.match(html, /<meta property="og:title"/);
        const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
        assert.ok(blocks.length >= 1);
        for (const b of blocks) assert.doesNotThrow(() => JSON.parse(b[1]));
      });

      test('contains the article content directly in the HTML', () => {
        const text = decode(html);
        const lead = e.kind === 'article' ? e.data.summary : e.data.purpose;
        assert.ok(text.includes(decode(lead)), 'summary/purpose not found in HTML');
        for (const h of bodyHeadings(e.body).filter((x) => x.depth <= 3)) {
          assert.ok(text.includes(decode(stripMd(h.text))), `heading "${h.text}" not in HTML`);
        }
        if (e.kind === 'prompt') {
          const firstLine = e.data.template.trim().split('\n')[0];
          assert.ok(text.includes(decode(firstLine)), 'prompt template not in HTML');
        }
      });

      if (e.kind === 'article' && (e.data.review_checklist ?? []).length) {
        test('renders the coding-agent review checklist', () => {
          assert.match(html, /id="review-checklist"/);
        });
      }
    });
  }
});

describe('indexability endpoints', () => {
  const htmlPages = readdirSync(DIST).filter((f) => f.endsWith('.html') && f !== '404.html');

  test('all public HTML pages live at the site root (no nested URLs)', () => {
    const dirs = readdirSync(DIST).filter((f) => statSync(join(DIST, f)).isDirectory() && f !== '_astro');
    assert.deepEqual(dirs, [], `unexpected nested output directories: ${dirs.join(', ')}`);
  });

  test('sitemap.xml lists every indexable page and nothing else', () => {
    const base = (process.env.BASE_PATH || '/').replace(/\/$/, '');
    const xml = read('sitemap.xml');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => new URL(m[1]).pathname.slice(base.length).replace(/\/$/, '') || '/')
      .sort();
    const expected = htmlPages
      .filter((f) => !/<meta name="robots" content="noindex/.test(read(f)))
      .map((f) => (f === 'index.html' ? '/' : '/' + f.replace(/\.html$/, '')))
      .sort();
    assert.deepEqual(locs, expected);
  });

  test('robots.txt exists, allows crawling and points to the sitemap', () => {
    const robots = read('robots.txt');
    assert.match(robots, /User-agent: \*/);
    assert.match(robots, /Allow: \//);
    assert.match(robots, /Sitemap: https?:\/\/\S+\/sitemap\.xml/);
  });

  test('rss.xml and llms.txt are generated', () => {
    assert.match(read('rss.xml'), /<rss version="2.0"/);
    assert.match(read('llms.txt'), /^# Vibe Knowledge/);
  });

  test('search index is lightweight and carries no article bodies', () => {
    const raw = read('search-index.json');
    const records = JSON.parse(raw);
    assert.ok(records.length >= articles.length + prompts.length);
    for (const r of records) assert.deepEqual(Object.keys(r).sort(), ['summary', 'tags', 'title', 'type', 'url']);
    assert.ok(Buffer.byteLength(raw) < 100_000, 'search index should stay small');
  });

  test('every internal link and #fragment resolves', () => {
    const r = checkLinks();
    assert.deepEqual(r.broken, []);
    assert.ok(r.internal > 500);
  });

  test('pages ship little JavaScript (content never depends on client rendering)', () => {
    const jsDir = join(DIST, '_astro');
    const js = existsSync(jsDir) ? readdirSync(jsDir).filter((f) => f.endsWith('.js')) : [];
    assert.equal(js.length, 0, `unexpected client JS bundles: ${js.join(', ')}`);
  });
});
