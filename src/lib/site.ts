import { getCollection, type CollectionEntry } from 'astro:content';
import { categories, technologies, promptCategories, reservedSlugs, techSlug } from '../data/taxonomy.mjs';

export const SITE_NAME = 'Vibe Knowledge';
export const SITE_TAGLINE = 'Understand, review and prompt what your coding agent built.';
export const SITE_DESCRIPTION =
  'Vibe Knowledge is a free software-engineering knowledge base for developers who work with AI coding agents: concept explanations, coding-agent review checklists and master prompt patterns.';

export type Article = CollectionEntry<'knowledge'>;
export type PromptPattern = CollectionEntry<'prompts'>;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Site-relative href that respects the GitHub Pages base path. */
export function href(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const clean = path === '/' || path === '' ? '/' : '/' + path.replace(/^\/+/, '');
  return clean === '/' ? `${BASE}/` : `${BASE}${clean}`;
}

/** Absolute URL for canonical links, the sitemap and feeds. */
export function absoluteUrl(path: string, site: URL | undefined): string {
  const origin = site ?? new URL('https://knowledge.example.com');
  return new URL(href(path), origin.origin).toString();
}

export const slugOf = (e: Article | PromptPattern) => e.data.slug ?? e.data.id;

export async function getArticles(): Promise<Article[]> {
  const all = await getCollection('knowledge', (e) => !e.data.draft);
  return all.sort((a, b) => a.data.title.localeCompare(b.data.title));
}

export async function getPrompts(): Promise<PromptPattern[]> {
  const all = await getCollection('prompts', (e) => !e.data.draft);
  return all.sort((a, b) => a.data.title.localeCompare(b.data.title));
}

export function categoryOf(slug: string) {
  return categories.find((c) => c.slug === slug)!;
}

export function promptCategoryOf(slug: string) {
  return promptCategories.find((c) => c.slug === slug)!;
}

export function describe(e: Article): string {
  return e.data.description ?? truncate(e.data.summary, 160);
}

export function truncate(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, t.lastIndexOf(' ', max - 1)).replace(/[,.;:]$/, '') + '…';
}

export function checklistItems(e: Article): { item: string; why?: string }[] {
  return e.data.review_checklist.map((c) => (typeof c === 'string' ? { item: c } : c));
}

/** Technologies that have at least one article, in taxonomy order. */
export function activeTechnologies(articles: Article[]) {
  return technologies.filter((t) => articles.some((a) => a.data.technology.includes(t.name)));
}

export { techSlug, categories, technologies, promptCategories };

/**
 * Every single-segment route served by src/pages/[slug].astro.
 * Throws on a duplicate so a slug collision can never silently shadow a page.
 */
export async function buildRouteTable() {
  const [articles, prompts] = await Promise.all([getArticles(), getPrompts()]);
  const routes = new Map<string, string>();
  const claim = (slug: string, owner: string) => {
    const prev = routes.get(slug) ?? (reservedSlugs.includes(slug) ? 'a reserved page' : undefined);
    if (prev) throw new Error(`Slug collision: "/${slug}" is claimed by ${prev} and ${owner}`);
    routes.set(slug, owner);
  };
  for (const a of articles) claim(slugOf(a), `article ${a.id}`);
  for (const p of prompts) claim(slugOf(p), `prompt ${p.id}`);
  const usedCategories = categories.filter((c) => articles.some((a) => a.data.category === c.slug));
  for (const c of usedCategories) claim(c.slug, `category ${c.slug}`);
  const techs = activeTechnologies(articles);
  for (const t of techs) claim(t.slug, `technology ${t.name}`);
  return { articles, prompts, usedCategories, techs };
}

/** Resolve related slugs to titles/hrefs across articles and prompts. */
export function resolveRelated(slugs: string[], articles: Article[], prompts: PromptPattern[]) {
  return slugs
    .map((s) => {
      const a = articles.find((x) => slugOf(x) === s);
      if (a) return { slug: s, title: a.data.title, summary: describe(a), kind: 'article' as const };
      const p = prompts.find((x) => slugOf(x) === s);
      if (p) return { slug: s, title: p.data.title, summary: p.data.purpose, kind: 'prompt' as const };
      return null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}
