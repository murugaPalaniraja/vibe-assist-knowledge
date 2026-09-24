---
id: bug-fix-root-cause-prompt
title: Root-Cause Bug Fix Prompt
category: bug-fix
technology: []
purpose: Make a coding agent reproduce a bug with a failing test, identify the root cause with evidence, and apply the smallest fix, instead of patching symptoms or weakening checks.
inputs: [project_context, bug_report, reproduction_steps, logs_or_stacktrace, suspected_files]
checks:
  - A failing test reproduces the bug before any fix
  - The root cause is explained with file:line evidence
  - The fix is minimal and addresses the cause, not the symptom
  - No tests are weakened or checks disabled
  - Similar occurrences elsewhere are searched for
output_format:
  - Reproduction (failing test and its output)
  - Root cause explanation with evidence
  - Minimal fix diff
  - Passing test output and full suite result
  - Other places with the same pattern
template: |
  CONTEXT
  {{project_context}}

  BUG REPORT
  {{bug_report}}

  REPRODUCTION STEPS
  {{reproduction_steps}}

  LOGS / STACK TRACE
  {{logs_or_stacktrace}}

  Possibly relevant files: {{suspected_files}}

  Steps:
  1. Write a test that reproduces the bug and show that it FAILS. Do not change production code yet.
  2. Find the root cause. Explain the chain from input to wrong behaviour with file:line references. Distinguish evidence from hypotheses.
  3. Propose the smallest fix that removes the cause. Explain why it does not break other callers.
  4. Apply the fix, show the test now passes, and run the full suite.
  5. Search the codebase for the same pattern and list other occurrences, without fixing them unless asked.

  Forbidden: deleting or loosening assertions, catching and ignoring the exception, adding sleeps or retries to hide the problem.
related: [java-exception-handling, debugging-investigation-prompt, testing-strategy, agent-change-review-prompt]
tags: [bug-fix, debugging, root-cause, tdd]
updated: 2026-09-24
---

## When to Use This Prompt

Use it whenever an agent is asked to "fix" something, and especially when an earlier attempt made the symptom disappear without explaining why.

## Tips

If the agent cannot write a failing test, the bug is not understood yet. Switch to the [debugging investigation prompt](/debugging-investigation-prompt) first.
