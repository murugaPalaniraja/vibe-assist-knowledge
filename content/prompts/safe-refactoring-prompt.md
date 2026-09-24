---
id: safe-refactoring-prompt
title: Safe Refactoring Prompt
category: refactoring
technology: []
purpose: Guide a coding agent through a behaviour-preserving refactoring in small, test-backed steps, with no functional changes mixed in and a clear record of each transformation.
inputs: [project_context, refactoring_goal, target_code, existing_tests]
checks:
  - Characterisation tests exist before changing structure
  - Each step is a named refactoring (extract, move, rename, inline)
  - No behaviour change is mixed into the refactoring
  - Public APIs and serialized formats are unchanged unless agreed
  - Tests pass after every step
output_format:
  - Current-state assessment and risks
  - Step-by-step plan of named refactorings
  - Diff per step with test results
  - Summary of structural improvement
template: |
  CONTEXT
  {{project_context}}

  GOAL
  {{refactoring_goal}}

  CODE TO REFACTOR
  {{target_code}}

  EXISTING TESTS
  {{existing_tests}}

  Rules:
  - This is a behaviour-preserving refactoring. Do not fix bugs or add features. If you find a bug, report it separately.
  - If test coverage of the target code is insufficient, first add characterisation tests that pin current behaviour, including odd behaviour.
  - Work in small named steps (Extract Method, Move Class, Introduce Parameter Object, …). Run the tests after each step.
  - Keep public method signatures, REST contracts, database schema and serialized formats unchanged unless explicitly allowed.

  Output: an assessment, a numbered plan, then for each step the diff and the test result, then what improved (for example "OrderService split by responsibility, 410 lines down to 3 classes of about 120").
related: [solid-principles, clean-architecture, testing-strategy]
tags: [refactoring, clean-code, design]
updated: 2026-09-24
---

## When to Use This Prompt

Use it when an agent is asked to "clean up" or "restructure" code. Agents often mix refactoring with behaviour changes, which makes review nearly impossible.

## Tips

Review the characterisation tests first. They define what "preserved behaviour" means.
