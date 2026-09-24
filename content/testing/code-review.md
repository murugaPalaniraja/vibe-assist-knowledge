---
id: code-review
title: Reviewing Code Written by AI Coding Agents
description: "How to review code written by AI coding agents: check claims against the diff, focus on risk, and classify findings as confirmed or potential."
summary: Reviewing agent-written code means verifying what actually changed against what the agent claims and what was asked. Focus review effort on risk (security, data, concurrency, public contracts), demand evidence such as tests and diffs, and classify findings honestly.
category: testing
technology: [Git]
concepts: [code review, diff review, risk-based review, evidence, scope creep, hallucinated APIs, confirmed vs potential findings]
difficulty: beginner
tags: [code-review, ai-agents, quality, process, vibe-coding]
vibe:
  understand: An agent's summary is a claim, not proof. The diff and the test results are the evidence.
  learn: Learn a repeatable review order, from scope and intent through risk hot spots and tests to readability, and how to phrase findings with a confidence level.
  review: Compare the summary with the diff. Look for unrequested changes, deleted tests, suppressed errors, invented APIs and missing negative tests.
  apply: Review in small batches, run the tests yourself, and use a fresh agent session with a structured prompt for a second opinion.
  prompt: Ask the agent to map every changed file to the requirement it serves and to list anything it changed that was not requested.
review_checklist:
  - The diff matches the agent's summary (no unmentioned files or behaviour changes)
  - Every requirement maps to code and to at least one test
  - No tests were deleted, skipped, or weakened to make the build pass
  - No errors are swallowed and no checks disabled (lint ignores, @SuppressWarnings, "|| true")
  - Called APIs/libraries actually exist in the project's versions (no hallucinated methods)
  - New dependencies are necessary, maintained and license-compatible
  - Security-sensitive areas (auth, input handling, secrets, queries) were read line by line
  - Tests were run locally or in CI by you, not only reported as passing
  - Findings are labelled Confirmed / Potential risk / Needs verification
related: [testing-strategy, spring-boot-testing, ai-agents, prompt-engineering, solid-principles]
prompts: [agent-change-review-prompt, ai-agent-output-verification-prompt]
sources:
  - title: Google Engineering Practices — How to do a code review
    url: https://google.github.io/eng-practices/review/reviewer/
  - title: Google Engineering Practices — What to look for in a code review
    url: https://google.github.io/eng-practices/review/reviewer/looking-for.html
updated: 2026-09-24
---

## What is Agent Code Review?

Code review checks a change for correctness, design, security and maintainability before it is merged. With AI coding agents, the reviewer has a new job: **verify the agent's claims**. Agents write fluent summaries, sometimes of work they did not complete.

## Why It is Different From Reviewing a Colleague

- Agents can **change more than was asked**: reformatting, "helpful" refactors, dependency upgrades.
- Agents may **invent APIs** or configuration keys that look plausible.
- When stuck, agents sometimes **weaken tests**, add broad `catch` blocks, or disable checks to reach green.
- Agents rarely add **negative tests** unless asked.
- The summary may describe the *intended* change, not the actual one.

## A Repeatable Review Order

1. **Intent.** Reread the original request. What was the agent supposed to do?
2. **Scope.** Run `git diff --stat`. Are the files and line counts plausible? Is anything unexpected touched (lock files, CI, security config)?
3. **Claims vs diff.** For each sentence in the agent's summary, find the code that makes it true.
4. **Risk hot spots first.** Read authentication and authorization, input validation, SQL and queries, [transactions](/database-transactions), concurrency, caching, and public API contracts line by line.
5. **Tests.** Do tests exist for each requirement, including the failure paths? Run them yourself. Temporarily break the code and confirm that a test fails.
6. **Operability.** Check logging (no secrets), configuration, migrations, and backward compatibility.
7. **Readability.** Naming, duplication and project conventions come last. They matter, but they are the cheapest to fix.

## Classifying Findings

| Label | Meaning | Example |
|---|---|---|
| **Confirmed** | Visible in the diff or reproduced | "`/api/admin/**` is `permitAll()` in `SecurityConfig.java:42`" |
| **Potential risk** | Plausible given the change, not yet shown | "Cache key omits tenantId, so it may serve cross-tenant data" |
| **Needs verification** | The summary is silent, so check | "Summary doesn't mention token expiry; confirm `exp` is validated" |

This vocabulary keeps reviews honest and prevents alarm fatigue. Never call something a bug without evidence.

## Common Mistakes

- Reviewing the summary instead of the diff.
- Approving a large diff because "the tests pass" when the agent also wrote those tests.
- Nit-picking style while missing a missing authorization check.
- Asking the *same* agent session "is this correct?" The same context produces the same blind spots.

## Using a Second Agent

Paste the summary, the requirements and the changed files into a fresh session with a structured prompt such as the [coding-agent change review prompt](/agent-change-review-prompt), and require `file:line` evidence for every finding.
