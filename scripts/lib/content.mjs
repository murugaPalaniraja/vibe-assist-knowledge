// Shared content loader used by validate-content.mjs and the test suite.
// Reads Markdown files straight from content/ so it works without a build.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { categories, technologies, reservedSlugs, SLUG_PATTERN } from '../../src/data/taxonomy.mjs';

export const CONTENT_DIR = new URL('../../content/', import.meta.url);

/** Sections rendered by the layout from frontmatter; bodies must not repeat them. */
export const LAYOUT_SECTIONS = ['Coding-Agent Review Checklist', 'Master Prompt Patterns', 'Related Concepts', 'Sources'];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : name.endsWith('.md') ? [p] : [];
  });
}

export function splitFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return { data: null, body: text };
  return { data: parseYaml(m[1]) ?? {}, body: m[2] };
}

/** Headings outside fenced code blocks: [{depth, text}] */
export function bodyHeadings(body) {
  const out = [];
  let fenced = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced) continue;
    const h = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) out.push({ depth: h[1].length, text: h[2] });
  }
  return out;
}

export function loadContent(root = CONTENT_DIR) {
  const dir = root instanceof URL ? fileURLToPath(root) : root;
  return walk(dir).map((file) => {
    const rel = relative(dir, file).split(sep).join('/');
    let parsed;
    try {
      parsed = splitFrontmatter(readFileSync(file, 'utf8'));
    } catch (e) {
      parsed = { data: null, body: '', parseError: String(e.message).split('\n')[0] };
    }
    const { data, body, parseError } = parsed;
    const kind = rel.startsWith('prompts/') ? 'prompt' : 'article';
    const slug = data ? String(data.slug ?? data.id ?? '') : '';
    return { file: rel, kind, data, body, slug, parseError };
  });
}

export function validateContent(entries) {
  const errors = [];
  const warnings = [];
  const err = (e, msg) => errors.push(`${e.file}: ${msg}`);
  const live = entries.filter((e) => e.data && !e.data.draft);
  const slugs = new Map();
  const categorySlugs = new Set(categories.map((c) => c.slug));
  const techSlugs = new Set(technologies.map((t) => t.slug));

  for (const e of entries) {
    if (!e.data) { err(e, e.parseError ? `invalid YAML frontmatter: ${e.parseError}` : 'missing YAML frontmatter'); continue; }
    const d = e.data;
    for (const f of e.kind === 'prompt'
      ? ['id', 'title', 'category', 'purpose', 'inputs', 'template', 'updated']
      : ['id', 'title', 'summary', 'category', 'updated']) {
      if (d[f] === undefined || d[f] === null || d[f] === '') err(e, `missing required field "${f}"`);
    }
    if (!SLUG_PATTERN.test(e.slug)) err(e, `slug "${e.slug}" is not lowercase-kebab-case`);
    const fileSlug = e.file.split('/').pop().replace(/\.md$/, '');
    if (fileSlug !== e.slug) warnings.push(`${e.file}: file name does not match slug "${e.slug}"`);
    if (reservedSlugs.includes(e.slug)) err(e, `slug "${e.slug}" is reserved by a site page`);
    if (categorySlugs.has(e.slug) || techSlugs.has(e.slug)) err(e, `slug "${e.slug}" collides with a category/technology hub URL`);
    if (slugs.has(e.slug)) err(e, `duplicate slug "${e.slug}" (also in ${slugs.get(e.slug)})`);
    slugs.set(e.slug, e.file);

    const heads = bodyHeadings(e.body);
    if (heads.some((h) => h.depth === 1)) err(e, 'body must not contain an H1; the layout renders the title as H1');
    for (const s of LAYOUT_SECTIONS) {
      if (heads.some((h) => h.depth === 2 && h.text.toLowerCase() === s.toLowerCase()))
        err(e, `body must not define "## ${s}"; it is generated from frontmatter`);
    }
    if (e.kind === 'article') {
      if (d.description && String(d.description).length > 170) err(e, 'description longer than 170 characters');
      if (d.origin === 'ingested' && !d.provenance) err(e, 'ingested content must include provenance');
      if (!d.description && String(d.summary ?? '').length > 160)
        warnings.push(`${e.file}: no description; meta description will be a truncated summary`);
      if (d.origin !== 'ingested' && heads.filter((h) => h.depth === 2).length < 3)
        warnings.push(`${e.file}: fewer than three ## sections`);
    }
  }

  const liveSlugs = new Set(live.map((e) => e.slug));
  for (const e of live) {
    for (const r of [...(e.data.related ?? []), ...(e.data.prompts ?? [])]) {
      if (!liveSlugs.has(r)) err(e, `references unknown or draft slug "${r}"`);
    }
  }
  return { errors, warnings };
}
