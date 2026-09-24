import { buildRouteTable, slugOf, describe, truncate, categoryOf } from './site';

/** Hand-written pages in src/pages that should be indexed. */
export const STATIC_PAGES = [
  { path: '/', title: 'Home' },
  { path: '/knowledge', title: 'Knowledge' },
  { path: '/prompts', title: 'Prompt Library' },
  { path: '/checklists', title: 'Coding-Agent Review Checklists' },
  { path: '/vibe-assist-demo', title: 'Vibe-Assist Demo' },
  { path: '/copilot-agent', title: 'Copilot Agent Guide' },
  { path: '/about', title: 'About & Sources' },
];

export interface PageRecord {
  path: string;
  title: string;
  summary: string;
  kind: 'page' | 'article' | 'prompt' | 'category' | 'technology';
  tags: string[];
  lastmod?: Date;
  index: boolean;
  group?: string;
}

/** Every public HTML page, derived from the content collections. */
export async function pageInventory(): Promise<PageRecord[]> {
  const { articles, prompts, usedCategories, techs } = await buildRouteTable();
  const newest = [...articles, ...prompts].reduce(
    (m, e) => (e.data.updated > m ? e.data.updated : m), new Date(0));
  return [
    ...STATIC_PAGES.map((p) => ({ ...p, summary: '', kind: 'page' as const, tags: [], lastmod: newest, index: true })),
    ...articles.map((a) => ({
      path: '/' + slugOf(a),
      title: a.data.title,
      summary: truncate(describe(a), 180),
      kind: 'article' as const,
      tags: [...new Set([...a.data.tags, ...a.data.technology.map((t) => t.toLowerCase())])],
      lastmod: a.data.updated,
      index: a.data.index,
      group: categoryOf(a.data.category).name,
    })),
    ...prompts.map((p) => ({
      path: '/' + slugOf(p),
      title: p.data.title,
      summary: truncate(p.data.purpose, 180),
      kind: 'prompt' as const,
      tags: p.data.tags,
      lastmod: p.data.updated,
      index: true,
      group: 'Prompt Library',
    })),
    ...usedCategories.map((c) => ({
      path: '/' + c.slug, title: `${c.name} Knowledge`, summary: c.description,
      kind: 'category' as const, tags: [], lastmod: newest, index: true,
    })),
    ...techs.map((t) => ({
      path: '/' + t.slug, title: `${t.name} Knowledge`, summary: `Articles, review checklists and prompts for ${t.name}.`,
      kind: 'technology' as const, tags: [t.slug], lastmod: newest, index: true,
    })),
  ];
}
