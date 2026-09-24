---
id: ai-agents
title: AI Agents and Coding Agents Explained
description: What AI coding agents are, how the reason-act-observe loop works, their failure modes, and how to supervise and review an agent's work safely.
summary: An AI agent is an LLM running in a loop. It decides on an action, calls a tool (read a file, run a command, edit code), observes the result, and repeats until it judges the task done. Coding agents are powerful but can drift from scope, overstate success, or take unsafe actions without guardrails.
category: ai-engineering
technology: [LLMs]
concepts: [agent loop, tool calling, planning, observation, context management, guardrails, human-in-the-loop, sandboxing, MCP]
difficulty: intermediate
tags: [ai-agents, coding-agents, llm, automation, vibe-coding]
vibe:
  understand: An agent is a model plus tools plus a loop. It acts, looks at the result, and decides the next step.
  learn: Learn the agent loop, tool design, context management, permission models and sandboxing, and why agents need verifiable checkpoints.
  review: Compare the agent's final summary against the actual diff, commands and test output. Look for scope creep, skipped steps and weakened checks.
  apply: Give agents precise tasks, least-privilege tools, a sandbox, and require tests and evidence at checkpoints.
  prompt: Ask the agent for a step-by-step log of actions taken, commands run and their exit codes, and anything it could not complete.
review_checklist:
  - The agent's claimed actions match the diff, commands and test output
  - No unrequested changes (dependencies, CI, config, formatting sweeps)
  - Destructive commands and external side effects required human approval
  - Secrets were not read or printed unnecessarily
  - Incomplete work or assumptions are explicitly reported
  - Tests were run after the final change, not only earlier
  - The agent had least-privilege tool access for the task
related: [llm-fundamentals, prompt-engineering, rag, code-review, testing-strategy]
prompts: [ai-agent-output-verification-prompt, agent-change-review-prompt]
sources:
  - title: Anthropic — Building effective agents
    url: https://www.anthropic.com/engineering/building-effective-agents
  - title: Yao et al. — ReAct — Synergizing Reasoning and Acting in Language Models
    url: https://arxiv.org/abs/2210.03629
  - title: Model Context Protocol — Introduction
    url: https://modelcontextprotocol.io/introduction
updated: 2026-09-24
---

## What is an AI Agent?

An **AI agent** uses an LLM to *decide actions*, not just to produce text. It has **tools** (functions it can call), an **environment** (a repository, terminal or browser) and a **loop**:

1. Read the goal and the current context.
2. Choose an action, such as `read_file`, `run_tests`, `edit` or `search`.
3. Execute the tool and **observe** the result.
4. Update the plan and repeat until done, or ask for help.

**Coding agents** (in IDEs, CLIs and cloud sandboxes) apply this loop to software tasks. They explore the codebase, edit files, run builds and tests, and summarise what they did.

## Why Agents Are Useful

- They handle multi-step work: find the relevant code, change it, run the tests, fix the failures.
- They use real feedback (compiler errors, test output) instead of guessing.
- They work across many files with project conventions.

## Common Failure Modes

- **Overclaiming.** "All tests pass" when tests were not run after the last edit.
- **Scope creep.** Unrelated refactors or dependency upgrades.
- **Goal substitution.** Making the test pass by changing the test or skipping the check.
- **Context loss** in long sessions: forgetting constraints stated early.
- **Hallucinated APIs** or configuration properties.
- **Unsafe actions** without guardrails: deleting files, force-pushing, running unknown scripts.
- **Prompt injection** from content the agent reads (issues, web pages, dependency READMEs).

## Supervising Agents Well

- Give **small, well-specified tasks** with acceptance criteria (see [prompt engineering](/prompt-engineering)).
- Use **least privilege**: a sandbox, no production credentials, approval for destructive or external actions.
- Add **checkpoints**: a plan review before implementation, a diff review before merge.
- Demand **evidence**: command output, test results and `file:line` references.
- Review the **diff, not the summary** (see [reviewing agent code](/code-review)).

## The Vibe-Assist Angle

Vibe-Assist sits *after* the coding agent. It turns the agent's summary into an explanation of the concepts involved, a risk-focused review checklist, what to learn, and a master prompt that sends the agent (or a fresh one) back to verify its work.

## When Not to Use an Agent

Avoid agents for tasks you cannot verify (no tests, no reproducible check), for security-critical changes without expert review, and for irreversible operations on production systems.
