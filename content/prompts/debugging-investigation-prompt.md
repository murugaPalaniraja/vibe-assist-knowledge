---
id: debugging-investigation-prompt
title: Debugging Investigation Prompt
category: debugging
technology: []
purpose: Run a disciplined, hypothesis-driven investigation of a failure before any fix. The agent gathers evidence, ranks hypotheses and designs experiments that distinguish between them.
inputs: [project_context, symptom, when_it_started, logs_metrics_traces, recent_changes]
checks:
  - Symptom precisely described and scoped
  - Hypotheses ranked with supporting/contradicting evidence
  - Cheap discriminating experiments proposed first
  - No code changes until a cause is confirmed
output_format:
  - Symptom statement
  - Timeline and recent changes
  - Hypotheses table (hypothesis | for | against | experiment)
  - Next experiment and expected outcomes
template: |
  CONTEXT
  {{project_context}}

  SYMPTOM
  {{symptom}}
  Started: {{when_it_started}}

  EVIDENCE
  {{logs_metrics_traces}}

  RECENT CHANGES (deploys, config, dependencies, data)
  {{recent_changes}}

  Do not change code yet.
  1. Restate the symptom precisely: who is affected, how often, since when, and what is NOT affected.
  2. Build a timeline that correlates the symptom with recent changes.
  3. List three to six hypotheses. For each, give the evidence for, the evidence against, and one cheap experiment whose result would confirm or rule it out.
  4. Recommend the next experiment and what each possible outcome would mean.
  5. Once a cause is confirmed, hand over to a root-cause fix: a failing test, then a minimal fix.
related: [bug-fix-root-cause-prompt, java-exception-handling, connection-pooling, database-transactions]
tags: [debugging, incident, investigation]
updated: 2026-09-24
---

## When to Use This Prompt

Use it for intermittent failures, production incidents and "works on my machine" problems, where jumping straight to a fix usually masks the real cause.
