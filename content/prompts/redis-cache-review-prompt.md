---
id: redis-cache-review-prompt
title: Redis Cache Implementation Review Prompt
category: database-review
technology: [Redis, Spring Boot]
purpose: Review a cache added by a coding agent for key correctness, TTL, invalidation, failure behaviour, serialization, stampede protection, security and tests.
inputs: [project_context, agent_summary, cache_config, cached_methods, write_paths]
checks:
  - Cache key correctness (all result-affecting inputs, tenant/user scope)
  - TTL configuration
  - Invalidation on every write path, after commit
  - Serialization format
  - Behaviour when Redis is down or slow
  - Stampede protection for hot keys
  - Memory bounds and eviction policy
  - Security of cached data and of Redis access
  - Tests against real Redis
  - Observability (hit ratio)
output_format:
  - Cache inventory (cache | key format | TTL | value type | invalidated by)
  - Write paths not invalidating caches
  - Findings with classification
  - Missing tests
template: |
  CONTEXT
  {{project_context}}

  AGENT SUMMARY
  {{agent_summary}}

  CACHE CONFIGURATION
  {{cache_config}}

  CACHED METHODS
  {{cached_methods}}

  ALL WRITE PATHS FOR THE CACHED DATA (services, admin endpoints, batch jobs, events)
  {{write_paths}}

  1. Build the cache inventory table. For each key, list every input that changes the result and confirm that the key includes it (tenant, user, locale, pagination, version).
  2. Confirm every entry has a TTL, and justify it against how stale the data may be.
  3. For every write path, show where the cache is evicted or updated. Confirm this happens after the database commit, not before.
  4. Check serialization (JSON vs JDK serialization) and what happens when the cached class changes shape.
  5. Explain what users see if Redis is down or has 2 s latency. Is there a timeout, and are errors treated as misses?
  6. Check hot keys for stampede protection (sync=true, locks, jitter).
  7. Check memory: value sizes, key cardinality, maxmemory policy.
  8. Check security: is sensitive data cached, is Redis authenticated and TLS-protected, can users read each other's entries?
  9. List the tests that exist and the missing ones: hit, miss, eviction on update, Redis unavailable, tenant isolation.

  Label findings Confirmed, Potential risk or Needs verification, with file:line.
related: [redis-caching, database-transactions, performance-review-prompt]
tags: [redis, caching, review]
updated: 2026-09-24
---

## When to Use This Prompt

Use it when an agent reports "added Redis caching" or "added @Cacheable". Caching bugs (stale or cross-tenant data) rarely show up in happy-path tests.
