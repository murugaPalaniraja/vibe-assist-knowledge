---
id: concurrency-review-prompt
title: Concurrency and Thread-Safety Review Prompt
category: code-review
technology: [Java, Python]
purpose: Find race conditions, visibility problems, deadlocks and lifecycle issues in concurrent code by making the agent enumerate shared state and the mechanism protecting each access.
inputs: [project_context, changed_files, concurrency_model]
checks:
  - Shared mutable state and how each access is protected
  - Check-then-act and read-modify-write sequences
  - Lock ordering and blocking inside locks
  - Executor and thread-pool lifecycle and bounds
  - Interrupt/cancellation and error propagation
  - Database-level races (lost updates)
output_format:
  - Shared-state inventory (state | accessed by | protection | safe?)
  - Findings with interleaving scenarios
  - Suggested fixes and concurrency tests
template: |
  CONTEXT
  {{project_context}}
  Concurrency model (threads, virtual threads, asyncio, workers, multiple instances): {{concurrency_model}}

  CHANGED FILES
  {{changed_files}}

  1. Build a table of every piece of state that more than one thread, task, process or service instance can touch: fields, static state, caches, database rows, files. For each one, name the protection (immutable, confinement, lock, atomic, concurrent collection, DB constraint or lock).
  2. Find check-then-act and read-modify-write sequences. For each, describe a concrete interleaving of two actors that produces a wrong result, or explain why none exists.
  3. Check lock ordering, I/O while holding locks, and synchronized or pinning issues.
  4. Check executors: bounded? shut down? exceptions surfaced? InterruptedException or cancellation handled?
  5. Remember horizontal scaling: an in-memory lock does not protect across instances.

  Label findings Confirmed, Potential risk or Needs verification, and propose a test (latch-based or stress) for each Potential risk.
related: [java-multithreading, python-async-multiprocessing, database-transactions, java-hashmap]
tags: [concurrency, threads, race-conditions]
updated: 2026-09-24
---

## When to Use This Prompt

Use it whenever a change adds threads, async tasks, shared caches, schedulers, or counters updated by multiple requests.
