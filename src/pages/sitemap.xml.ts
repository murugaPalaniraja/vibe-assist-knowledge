import type { APIRoute } from 'astro';
import { pageInventory } from '../lib/inventory';
import { absoluteUrl } from '../lib/site';

// Generated from the content collections: a new article appears here on the
// next build with no manual step. Pages marked index:false are excluded.
export const GET: APIRoute = async ({ site }) => {
  const pages = (await pageInventory()).filter((p) => p.index);
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.map((p) =>
      `  <url><loc>${esc(absoluteUrl(p.path, site))}</loc>` +
      (p.lastmod ? `<lastmod>${p.lastmod.toISOString().slice(0, 10)}</lastmod>` : '') +
      '</url>'),
    '</urlset>',
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
