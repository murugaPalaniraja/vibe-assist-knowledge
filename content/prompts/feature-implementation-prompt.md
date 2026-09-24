---
id: feature-implementation-prompt
title: Feature Implementation Prompt for Coding Agents
category: feature-implementation
technology: []
purpose: Give a coding agent a feature request as a precise work order with scope, constraints, acceptance criteria and required evidence, so the result can be verified instead of trusted.
inputs: [project_context, feature_description, acceptance_criteria, constraints, relevant_files]
checks:
  - The agent restates the task and assumptions before coding
  - A plan is proposed and scoped to the relevant files
  - Existing conventions are followed
  - Acceptance criteria are each covered by a test
  - Tests and build are run after the final change
output_format:
  - Restated task and assumptions
  - Plan (files to change, new files, tests)
  - Implementation diff
  - Test and build output
  - List of changed files and anything not done
template: |
  CONTEXT
  {{project_context}}
  Relevant files you should read first:
  {{relevant_files}}

  FEATURE
  {{feature_description}}

  ACCEPTANCE CRITERIA (each must be proven by a test)
  {{acceptance_criteria}}

  CONSTRAINTS
  {{constraints}}
  - Follow the existing structure and naming in the files above.
  - Do not add dependencies, change CI, or refactor unrelated code without asking.
  - Do not weaken or delete existing tests.

  PROCESS
  1. Restate the task and list any assumptions. If something is ambiguous, ask before coding.
  2. Propose a short plan: files to change, new files, tests to add. Wait for approval.
  3. Implement in small steps. Write the failing test first where practical.
  4. Run the full test suite and build after your final change, and paste the output.
  5. Report: files changed, tests added, acceptance criteria to test mapping, and anything you did not complete.
related: [prompt-engineering, ai-agents, agent-change-review-prompt, clean-architecture]
tags: [feature, implementation, ai-agents]
updated: 2026-09-24
---

## When to Use This Prompt

Use it when starting a feature with a coding agent. The "plan first, then wait" step catches misunderstandings before they turn into a large diff.

## Tips

Acceptance criteria written as observable behaviour ("`GET /api/orders/99` for another user's order returns 404") produce far better tests than descriptions like "handle authorization".
