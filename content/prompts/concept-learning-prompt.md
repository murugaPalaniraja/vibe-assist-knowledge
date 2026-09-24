---
id: concept-learning-prompt
title: Learn the Concepts Behind an Agent's Change
category: learning
technology: []
purpose: Turn a coding agent's change into a short, personalised lesson on the concepts it used, grounded in the actual code and linked to trustworthy references, so the developer can own the code.
inputs: [agent_summary, changed_files, developer_level, reference_links]
checks:
  - Concepts are identified from the actual code
  - Explanations use the project's own code as examples
  - Each concept has a check-your-understanding question
  - Sources are linked, not invented
output_format:
  - Concept map (concept → where it appears in the code)
  - Short explanation per concept at the stated level
  - Questions to test understanding
  - What to read next
template: |
  I am a {{developer_level}} developer. A coding agent made this change and I want to understand it well enough to maintain it.

  AGENT SUMMARY
  {{agent_summary}}

  CHANGED FILES
  {{changed_files}}

  Use these references where relevant, and do not invent others:
  {{reference_links}}

  1. List the engineering concepts this code relies on (for example JWT validation, cache-aside, transaction propagation) and where each appears (file:line).
  2. For each concept, explain it in five sentences or fewer at my level, using THIS code as the example.
  3. For each concept, give one "what would happen if…" question that tests understanding (for example "…the cache key omitted tenantId?"), with the answer hidden at the end.
  4. Suggest the order in which to learn them and which reference to read for each.
related: [prompt-engineering, llm-fundamentals, code-review]
tags: [learning, education, onboarding]
updated: 2026-09-24
---

## When to Use This Prompt

Use it when an agent produced working code that uses concepts you don't fully understand yet. This is the **Learn** step of Understand → Learn → Review → Apply → Prompt. Pair it with the matching Vibe Knowledge articles as `{{reference_links}}`.
