import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/site';

// Everything is public and crawlable; Bing (which grounds Copilot's public
// website knowledge) gets no special treatment beyond the sitemap pointer.
// Note: GitHub Pages project sites (user.github.io/repo) do not serve a
// robots.txt at the domain root — use a custom domain for full effect.
export const GET: APIRoute = ({ site }) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${absoluteUrl('/sitemap.xml', site)}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
