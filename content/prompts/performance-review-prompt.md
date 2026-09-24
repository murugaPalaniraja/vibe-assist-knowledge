---
id: performance-review-prompt
title: Performance Review Prompt
category: performance-review
technology: []
purpose: Review a change for performance risks such as N+1 queries, missing indexes, unbounded work, blocking I/O, pool exhaustion and cache misuse, and require measurements instead of guesses.
inputs: [project_context, changed_files, expected_load, performance_requirements]
checks:
  - Database access patterns (N+1, missing indexes, unbounded queries)
  - Unbounded loops, collections or result sets
  - Blocking I/O on request or event-loop threads
  - Connection and thread pool usage
  - Caching correctness and hit potential
  - Measurements (EXPLAIN, profiling, load test) back each claim
output_format:
  - Hot path description
  - Findings (impact | file:line | Confirmed / Potential risk / Needs verification | measurement to confirm)
  - Recommended fixes, ordered by impact per effort
template: |
  CONTEXT
  {{project_context}}
  Expected load: {{expected_load}}
  Requirements (latency, throughput): {{performance_requirements}}

  CHANGED FILES
  {{changed_files}}

  1. Identify the hot paths this change affects and estimate how many times each runs per request or job.
  2. Database: list every query with its WHERE, JOIN and ORDER BY, whether an index supports it, and whether it runs in a loop (N+1). Flag missing pagination or LIMIT.
  3. Memory: flag unbounded collections, loading whole tables, and large objects held in caches or sessions.
  4. Concurrency: blocking calls on request or event-loop threads, pool sizes, locks held during I/O.
  5. Caching: what is cached, the key, the TTL, invalidation, and the expected hit ratio.
  6. For each finding, give the concrete measurement that would confirm it (EXPLAIN ANALYZE, a profiler, a load test).

  Do not recommend micro-optimisations without evidence. Label findings Confirmed, Potential risk or Needs verification.
related: [database-indexing, connection-pooling, redis-caching, java-multithreading, python-async-multiprocessing]
tags: [performance, database, scalability]
updated: 2026-09-24
---

## When to Use This Prompt

Use it for changes that touch queries, loops over data, caching, pools or request handling, and before any release expected to see higher load.
