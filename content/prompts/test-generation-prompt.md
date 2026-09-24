---
id: test-generation-prompt
title: Meaningful Test Generation Prompt
category: testing
technology: []
purpose: Ask a coding agent for tests that would actually fail if the behaviour broke, covering failure paths and edge cases at the right test level, rather than tautological happy-path tests.
inputs: [project_context, code_under_test, requirements, existing_test_conventions]
checks:
  - Each requirement maps to at least one test
  - Failure and edge cases are covered
  - The right level is used (unit vs slice vs integration)
  - Mocks only at boundaries, no tautological assertions
  - A mutation check shows the tests fail when the code is broken
output_format:
  - Behaviour list ranked by risk
  - Test plan (behaviour | level | test name)
  - Test code
  - Mutation check results
template: |
  CONTEXT
  {{project_context}}
  Follow these existing test conventions: {{existing_test_conventions}}

  CODE UNDER TEST
  {{code_under_test}}

  REQUIREMENTS
  {{requirements}}

  1. List the behaviours of this code, ranked by risk (security, data loss, money and correctness first).
  2. For each behaviour, choose the test level (unit, slice or integration) and a descriptive test name such as rejectsExpiredToken or evictsCacheAfterUpdate.
  3. Cover failure paths: invalid input, not found, unauthorized or forbidden, conflicts, timeouts, the dependency being unavailable.
  4. Use mocks or fakes only at boundaries (HTTP clients, clock, message broker). Never mock the class under test. No assertion may only restate a mocked return value.
  5. Use real infrastructure (Testcontainers) where database or cache behaviour matters.
  6. Mutation check: for the three most important behaviours, describe a one-line change to the production code that should break them, and confirm that a test fails.

  Output the test plan table, then the test code, then the mutation check results.
related: [testing-strategy, spring-boot-testing, code-review]
tags: [testing, unit-tests, integration-tests]
updated: 2026-09-24
---

## When to Use This Prompt

Use it after an agent reports "added tests", or when you ask an agent for tests for existing code.

## Tips

The mutation check at the end is the key step. It turns "the tests pass" into "the tests can fail".
