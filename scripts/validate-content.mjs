#!/usr/bin/env node
// Pre-build content validation. Schema/type checks are done by Astro's
// content collections (src/content.config.ts); this script covers the
// cross-file rules a per-file schema cannot express.
import { loadContent, validateContent } from './lib/content.mjs';

const entries = loadContent();
const { errors, warnings } = validateContent(entries);
const articles = entries.filter((e) => e.kind === 'article').length;
const prompts = entries.filter((e) => e.kind === 'prompt').length;

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
console.log(`Validated ${articles} articles and ${prompts} prompt patterns: ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
