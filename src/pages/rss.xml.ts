import type { APIRoute } from 'astro';
import { pageInventory } from '../lib/inventory';
import { absoluteUrl, SITE_NAME, SITE_DESCRIPTION } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const items = (await pageInventory())
    .filter((p) => (p.kind === 'article' || p.kind === 'prompt') && p.index)
    .sort((a, b) => (b.lastmod?.getTime() ?? 0) - (a.lastmod?.getTime() ?? 0) || a.path.localeCompare(b.path))
    .slice(0, 50);
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(SITE_NAME)}</title>
  <link>${absoluteUrl('/', site)}</link>
  <description>${esc(SITE_DESCRIPTION)}</description>
  <language>en</language>
  <atom:link href="${absoluteUrl('/rss.xml', site)}" rel="self" type="application/rss+xml" />
${items.map((i) => `  <item>
    <title>${esc(i.title)}</title>
    <link>${absoluteUrl(i.path, site)}</link>
    <guid isPermaLink="true">${absoluteUrl(i.path, site)}</guid>
    <description>${esc(i.summary)}</description>
    ${i.lastmod ? `<pubDate>${i.lastmod.toUTCString()}</pubDate>` : ''}
    ${i.group ? `<category>${esc(i.group)}</category>` : ''}
  </item>`).join('\n')}
</channel>
</rss>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
