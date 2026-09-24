---
id: change-documentation-prompt
title: Change Documentation Prompt
category: documentation
technology: []
purpose: Produce accurate, reviewer-friendly documentation of a change (PR description, README updates, ADR) derived from the actual diff rather than the agent's intentions.
inputs: [original_request, diff, existing_docs, audience]
checks:
  - Description matches the diff
  - Configuration, migration and operational impact are documented
  - Breaking changes are called out
  - Existing docs that became wrong are updated
output_format:
  - PR description (why, what, how to test, risks)
  - Doc updates as diffs
  - Optional ADR for significant decisions
template: |
  ORIGINAL REQUEST
  {{original_request}}

  DIFF
  {{diff}}

  EXISTING DOCUMENTATION
  {{existing_docs}}

  Audience: {{audience}}

  1. Write a PR description based only on the diff: Why, What changed (grouped by area), How to test (exact commands), Risks and rollback, Configuration or migration changes.
  2. Find statements in the existing docs that this change makes wrong, and propose corrected text as diffs.
  3. If the change contains a significant design decision (new dependency, new pattern, data model change), draft a short ADR: context, decision, alternatives, consequences.
  4. Do not describe anything that is not in the diff.
related: [code-review, prompt-engineering]
tags: [documentation, pull-request, adr]
updated: 2026-09-24
---

## When to Use This Prompt

Use it before opening a pull request for agent-written code. A description derived from the diff exposes mismatches with what the agent *said* it did.
