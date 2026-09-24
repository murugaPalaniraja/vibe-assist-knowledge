import type { APIRoute } from 'astro';
import { pageInventory } from '../lib/inventory';
import { href } from '../lib/site';

// Deliberately small: title, URL, summary and tags only. Article bodies are
// never shipped to the browser — crawlers read them from the HTML pages.
export const GET: APIRoute = async () => {
  const records = (await pageInventory())
    .filter((p) => p.kind !== 'page')
    .map((p) => ({ title: p.title, url: href(p.path), summary: p.summary, tags: p.tags, type: p.kind }));
  return new Response(JSON.stringify(records), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
