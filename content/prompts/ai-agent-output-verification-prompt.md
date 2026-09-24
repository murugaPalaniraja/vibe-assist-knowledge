---
id: ai-agent-output-verification-prompt
title: AI Agent Output Verification Prompt
category: ai-agent-review
technology: [LLMs]
purpose: Make a coding agent account for its own session, covering actions taken, commands run, evidence produced, assumptions and incomplete work, so a human can verify the result instead of trusting the summary.
inputs: [original_request, agent_summary, session_log_or_diff]
checks:
  - Every claimed action has evidence (command output, diff)
  - Tests were run after the last change
  - Assumptions and skipped steps are disclosed
  - No unrequested or risky actions were taken
  - Any LLM features added validate model output
output_format:
  - Action log (step | action | evidence | result)
  - Claims that lack evidence
  - Assumptions and open questions
  - Remaining work
template: |
  ORIGINAL REQUEST
  {{original_request}}

  YOUR PREVIOUS SUMMARY
  {{agent_summary}}

  DIFF / SESSION LOG
  {{session_log_or_diff}}

  Account for your work honestly. It is better to report a gap than to overstate success.
  1. List each action you took in order: files read, files changed, commands run with exit codes.
  2. For each claim in your summary, point to the evidence (diff hunk, command output). Mark claims without evidence as "unverified".
  3. Were tests and build run AFTER your final edit? Paste the output, or say they were not run.
  4. List assumptions you made and any requirement you did not fully implement.
  5. List changes you made that were not requested, and why.
  6. If you added code that calls an LLM, explain how its output is validated before use.

  Do not make new changes in this step.
related: [ai-agents, code-review, llm-fundamentals, agent-change-review-prompt]
tags: [ai-agents, verification, accountability]
updated: 2026-09-24
---

## When to Use This Prompt

Send it to the **same** agent right after it reports completion. It is the cheapest way to surface skipped steps before a human reviews the diff.
