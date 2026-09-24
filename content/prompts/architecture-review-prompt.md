---
id: architecture-review-prompt
title: Architecture and Design Review Prompt
category: architecture-review
technology: []
purpose: Assess whether a change fits the system's existing architecture, respects layer boundaries and dependency direction, and avoids both god classes and needless abstraction.
inputs: [project_context, architecture_description, changed_files, design_goal]
checks:
  - Consistency with the existing structure and conventions
  - Dependency direction and layer boundaries
  - Responsibility of each new class/module
  - Abstractions justified by variation or testing needs
  - Coupling to frameworks and infrastructure
output_format:
  - Where the change sits in the architecture (short description or diagram)
  - Boundary violations with file:line
  - Over- and under-engineering findings
  - Recommended adjustments
template: |
  CONTEXT
  {{project_context}}

  CURRENT ARCHITECTURE (layers, modules, conventions)
  {{architecture_description}}

  DESIGN GOAL OF THIS CHANGE
  {{design_goal}}

  CHANGED FILES
  {{changed_files}}

  1. Describe where each new or changed class sits in the architecture and what depends on it.
  2. List imports that break the dependency rule (for example domain or use-case code importing web, persistence or framework classes, or controllers calling repositories directly if the project forbids it).
  3. State each new class's responsibility in one sentence. Flag classes that need "and".
  4. Flag abstractions without a second implementation or test need, and conversely duplicated logic that should share one.
  5. Check that the change follows existing conventions rather than introducing a new pattern.

  Label findings Confirmed, Potential risk or Needs verification. Prefer the smallest adjustment that restores consistency.
related: [clean-architecture, solid-principles, spring-dependency-injection, python-mro]
tags: [architecture, design, review]
updated: 2026-09-24
---

## When to Use This Prompt

Use it for changes that add new modules, layers or cross-cutting concerns, and whenever an agent created many new files for a small feature.
