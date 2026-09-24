import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import {
  categories,
  difficulties,
  promptCategories,
  technologies,
  SLUG_PATTERN,
} from './data/taxonomy.mjs';

const slug = z.string().regex(SLUG_PATTERN, 'lowercase-kebab-case only');
const categoryEnum = z.enum(categories.map((c) => c.slug) as [string, ...string[]]);
const technologyEnum = z.enum(technologies.map((t) => t.name) as [string, ...string[]]);

const source = z.object({
  title: z.string(),
  url: z.url(),
  license: z.string().optional(),
  retrieved_at: z.coerce.date().optional(),
});

/** Provenance for items produced by vibe-assist-ingestion. */
const provenance = z.object({
  name: z.string(),
  url: z.string(),
  retrieved_at: z.coerce.date(),
  license: z.string(),
  source_type: z.enum(['url', 'markdown', 'html', 'json', 'csv', 'git']),
  content_hash: z.string().optional(),
  publish_mode: z.enum(['full', 'excerpt']).optional(),
});

/**
 * Knowledge units. The body holds the prose sections (## headings);
 * structured, machine-readable parts live in frontmatter and are rendered
 * by the layout so they can also be aggregated (e.g. /checklists).
 */
const knowledge = defineCollection({
  loader: glob({
    base: './content',
    pattern: ['**/*.md', '!prompts/**'],
    generateId: ({ data, entry }) => String(data.slug ?? data.id ?? entry.replace(/\.md$/, '')),
  }),
  schema: z.object({
    id: slug,
    slug: slug.optional(),
    title: z.string().min(5),
    description: z.string().min(50).max(170).optional(),
    summary: z.string().min(40),
    category: categoryEnum,
    technology: z.array(technologyEnum).default([]),
    concepts: z.array(z.string()).default([]),
    difficulty: z.enum(difficulties as [string, ...string[]]).default('intermediate'),
    tags: z.array(z.string()).default([]),
    // The five Vibe-Assist lenses, answered in one or two sentences each.
    vibe: z
      .object({
        understand: z.string(),
        learn: z.string(),
        review: z.string(),
        apply: z.string(),
        prompt: z.string(),
      })
      .partial()
      .optional(),
    review_checklist: z
      .array(z.union([z.string(), z.object({ item: z.string(), why: z.string().optional() })]))
      .default([]),
    related: z.array(slug).default([]),
    prompts: z.array(slug).default([]),
    sources: z.array(source).default([]),
    origin: z.enum(['curated', 'ingested']).default('curated'),
    provenance: provenance.optional(),
    // false => noindex + excluded from the sitemap (thin/derived pages).
    index: z.boolean().default(true),
    draft: z.boolean().default(false),
    updated: z.coerce.date(),
  }),
});

/** Engineering prompt patterns (the Master Prompt Library). */
const prompts = defineCollection({
  loader: glob({
    base: './content/prompts',
    pattern: '**/*.md',
    generateId: ({ data, entry }) => String(data.slug ?? data.id ?? entry.replace(/\.md$/, '')),
  }),
  schema: z.object({
    id: slug,
    slug: slug.optional(),
    title: z.string().min(5),
    description: z.string().min(50).max(170).optional(),
    category: z.enum(promptCategories.map((c) => c.slug) as [string, ...string[]]),
    technology: z.array(technologyEnum).default([]),
    purpose: z.string().min(20),
    inputs: z.array(z.string()).min(1),
    checks: z.array(z.string()).default([]),
    output_format: z.array(z.string()).default([]),
    template: z.string().min(50),
    related: z.array(slug).default([]),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    updated: z.coerce.date(),
  }),
});

export const collections = { knowledge, prompts };
