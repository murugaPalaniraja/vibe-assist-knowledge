#!/usr/bin/env node
// Internal link checker for the built site (dist/). Verifies that every
// same-site href/src resolves to a generated file and that every #fragment
// resolves to an id on the target page. External links are not fetched
// (keeps CI offline and deterministic); they are only counted.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/** Map a site path (without base) to a file in dist, or null. */
export function resolvePath(dist, path) {
  const clean = decodeURIComponent(path.split('#')[0].split('?')[0]).replace(/^\/+/, '');
  const candidates = clean === '' ? ['index.html'] : [clean, `${clean}.html`, join(clean, 'index.html')];
  for (const c of candidates) {
    const p = join(dist, c);
    if (existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
}

const idCache = new Map();
function idsOf(file) {
  if (!idCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    idCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idCache.get(file);
}

export function checkLinks(dist = DIST, base = process.env.BASE_PATH || '/') {
  const prefix = base.replace(/\/$/, '');
  const pages = walk(dist).filter((f) => f.endsWith('.html'));
  const broken = [];
  let internal = 0;
  let external = 0;
  for (const page of pages) {
    // Ignore inline scripts/JSON-LD: strings there are not rendered links.
    const html = readFileSync(page, 'utf8').replace(/<script\b[\s\S]*?<\/script>/gi, '');
    const from = relative(dist, page).split(sep).join('/');
    for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      const raw = m[1].replace(/&amp;/g, '&');
      if (/^(https?:)?\/\//.test(raw)) { external++; continue; }
      if (/^(mailto:|tel:|data:|javascript:)/.test(raw)) continue;
      internal++;
      let target = page;
      let path = raw;
      if (!raw.startsWith('#')) {
        if (!raw.startsWith('/')) { broken.push(`${from}: relative link "${raw}" (use site-absolute links)`); continue; }
        if (prefix && !raw.startsWith(prefix + '/') && raw !== prefix) { broken.push(`${from}: "${raw}" is missing base path ${prefix}`); continue; }
        path = raw.slice(prefix.length);
        target = resolvePath(dist, path);
        if (!target) { broken.push(`${from}: "${raw}" does not resolve`); continue; }
      }
      const frag = raw.includes('#') ? decodeURIComponent(raw.split('#')[1]) : '';
      if (frag && target.endsWith('.html') && !idsOf(target).has(frag)) {
        broken.push(`${from}: "${raw}" fragment #${frag} not found`);
      }
    }
  }
  return { pages: pages.length, internal, external, broken };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!existsSync(DIST)) { console.error('dist/ not found; run `npm run build` first.'); process.exit(1); }
  const r = checkLinks();
  for (const b of r.broken) console.error(`broken ${b}`);
  console.log(`Checked ${r.internal} internal links across ${r.pages} pages (${r.external} external links not fetched): ${r.broken.length} broken.`);
  process.exit(r.broken.length ? 1 : 0);
}
