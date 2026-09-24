import type { APIRoute } from 'astro';
import { pageInventory } from '../lib/inventory';
import { absoluteUrl, SITE_NAME, SITE_DESCRIPTION } from '../lib/site';

// /llms.txt: a plain-text map of the site for LLM-based tools (llmstxt.org).
// Harmless for search engines, handy for agents that fetch a URL directly.
export const GET: APIRoute = async ({ site }) => {
  const pages = (await pageInventory()).filter((p) => p.index);
  const section = (title: string, kind: string) => {
    const list = pages.filter((p) => p.kind === kind);
    return list.length
      ? `## ${title}\n\n${list.map((p) => `- [${p.title}](${absoluteUrl(p.path, site)})${p.summary ? `: ${p.summary}` : ''}`).join('\n')}\n`
      : '';
  };
  const body = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    'Every article is organised as Understand / Learn / Review / Apply / Prompt and most include a coding-agent review checklist.',
    '',
    section('Knowledge articles', 'article'),
    section('Prompt patterns', 'prompt'),
    section('Technology hubs', 'technology'),
    section('Categories', 'category'),
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
