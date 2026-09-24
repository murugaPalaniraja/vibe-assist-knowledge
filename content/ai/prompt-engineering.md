---
id: prompt-engineering
title: Prompt Engineering for Coding Agents
description: "Prompt engineering for coding agents: context, constraints, acceptance criteria, verification and structured output, with a prompt review checklist."
summary: Prompt engineering is the practice of giving a model the context, constraints and success criteria it needs to do a task reliably. For coding agents, the best prompts read like a precise ticket, with scope, acceptance tests and a required way to prove the work.
category: ai-engineering
technology: [LLMs]
concepts: [system prompt, context, constraints, acceptance criteria, few-shot examples, chain of verification, structured output, prompt templates]
difficulty: beginner
tags: [prompt-engineering, llm, ai-agents, vibe-coding]
vibe:
  understand: A model only knows what is in its context. A good prompt supplies the missing context and defines what "done" means.
  learn: Learn the anatomy of an engineering prompt (role, context, task, constraints, acceptance criteria, output format, verification) and when examples help.
  review: Check whether prompts to agents are specific about scope, forbid risky shortcuts, and require evidence such as tests, file:line references and command output.
  apply: Use templates from the prompt library, fill them with real project context, and ask for a plan before code on larger tasks.
  prompt: Ask the agent to restate the task, list assumptions and propose a plan before writing code.
review_checklist:
  - The prompt states the goal, scope and what must NOT change
  - Relevant context is included (files, versions, conventions, constraints)
  - Acceptance criteria are testable
  - The output format is specified (plan, diff, table, JSON)
  - The agent is asked to verify (run tests, cite file:line) rather than assert
  - Untrusted input is clearly delimited from instructions
  - "Ambiguity handling is defined (ask vs assume and document)"
related: [llm-fundamentals, ai-agents, code-review, rag]
prompts: [concept-learning-prompt, feature-implementation-prompt, agent-change-review-prompt]
sources:
  - title: Anthropic Docs — Prompt engineering overview
    url: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview
  - title: OpenAI Docs — Prompt engineering
    url: https://platform.openai.com/docs/guides/prompt-engineering
updated: 2026-09-24
---

## What is Prompt Engineering?

Prompt engineering means designing the instructions and context you give a language model so it produces useful, verifiable output. For **coding agents**, a prompt is effectively a work order. The quality of the result tracks the quality of the specification.

## Anatomy of an Engineering Prompt

| Part | Purpose | Example |
|---|---|---|
| Role / stance | Sets the expertise and review posture | "You are reviewing as a senior Spring Security engineer." |
| Context | What the model can't know | Framework versions, relevant files, conventions |
| Task | The one thing to do | "Add JWT audience validation." |
| Constraints | Boundaries | "Do not modify tests unrelated to auth; no new dependencies." |
| Acceptance criteria | Definition of done | "Wrong-audience token returns 401; test proves it." |
| Output format | Shape of the answer | "Plan first, then a diff, then test output." |
| Verification | Evidence required | "Cite file:line for every claim; run `mvn test`." |

## Techniques That Work for Code

- **Plan first.** "Propose a plan and wait" prevents large wrong turns.
- **Examples.** Show one existing controller or test to copy conventions from.
- **Negative instructions with reasons.** "Don't catch generic Exception, because we rely on the global handler."
- **Force self-verification.** Ask for failing-then-passing tests and a check of the claims against the diff.
- **Structured output.** Tables or JSON make results easy to check.
- **A fresh session for review.** A reviewer that did not write the code is less biased.

## Common Mistakes

- "Make it better" or "fix the bug" with no reproduction steps or success criteria.
- Pasting an entire repository instead of the relevant files, which dilutes attention.
- Accepting "all tests pass" without output.
- Mixing untrusted content (issue text, web pages) with instructions without delimiters, which opens the door to prompt injection.

## Example

```text
Context: Spring Boot 3.3, Java 21. SecurityConfig.java and JwtConfig.java below.
Task: Add audience ("orders-api") validation to JWT decoding.
Constraints: Use Spring's OAuth2TokenValidator; no new dependencies; don't touch unrelated files.
Acceptance: token with aud=orders-api → 200; aud=other → 401; add both tests.
Output: 1) plan, 2) diff, 3) `mvn -q test` output, 4) list of files changed.
```

The [Prompt Library](/prompts) contains ready-made templates built on this structure.
