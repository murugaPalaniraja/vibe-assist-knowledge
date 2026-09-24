---
id: redis-caching
title: Redis Caching Patterns and Pitfalls
description: How Redis caching works (cache-aside, TTL, invalidation, eviction), Spring @Cacheable with Redis, and a coding-agent review checklist for cache implementations.
summary: Redis caching stores frequently read data in memory so the application can skip slower work such as database queries or remote calls. The hard parts are choosing keys and TTLs, invalidating stale data, and behaving correctly when the cache is unavailable.
category: databases
technology: [Redis, Spring Boot, Java]
concepts: [cache-aside, TTL, cache invalidation, eviction policy, serialization, cache stampede, write-through, Spring Cache abstraction]
difficulty: intermediate
tags: [redis, caching, performance, spring, database]
vibe:
  understand: A cache is a fast, disposable copy of data. Reads check Redis first and fall back to the source of truth on a miss.
  learn: Learn cache-aside vs write-through, TTL and invalidation, eviction policies, serialization formats, and stampede protection.
  review: Check key design (including tenant/user scope), TTLs, invalidation on writes, failure behaviour when Redis is down, serialization, and whether sensitive data is cached.
  apply: Cache read-heavy, slow, tolerably-stale data with explicit TTLs, evict after the database commit, and treat Redis as optional.
  prompt: Ask the agent to list every cache name, key format, TTL, invalidation trigger and what happens when Redis is unreachable.
review_checklist:
  - item: Cache key correctness
    why: Keys include every input that changes the result (tenant, user, locale, page, version).
  - item: TTL configuration
    why: Every entry has a TTL; no accidental "cache forever".
  - item: Cache invalidation
    why: Every write path that changes cached data evicts or updates it, after the transaction commits.
  - item: Serialization
    why: A stable format (JSON) with versioning; no Java native serialization of domain classes.
  - item: Failure behaviour
    why: If Redis is down or slow, requests fall back to the database with short timeouts instead of failing.
  - item: Concurrency and stampede protection
    why: Hot keys do not trigger thousands of simultaneous reloads on expiry (sync=true, locking or jitter).
  - item: Memory usage
    why: maxmemory and an eviction policy are set; large values and unbounded key sets are avoided.
  - item: Security
    why: No secrets or unnecessary personal data in cache values; Redis requires auth/TLS and is not publicly reachable.
  - item: Testing
    why: Tests cover hit, miss, eviction on update, and Redis-unavailable behaviour against a real Redis (Testcontainers).
  - item: Observability
    why: Hit ratio, latency, evictions and memory are measured.
related: [database-transactions, database-indexing, spring-dependency-injection, spring-security-jwt, java-hashmap]
prompts: [redis-cache-review-prompt, performance-review-prompt, agent-change-review-prompt]
sources:
  - title: Redis Documentation
    url: https://redis.io/docs/latest/
  - title: Redis Documentation — Key eviction
    url: https://redis.io/docs/latest/develop/reference/eviction/
  - title: Spring Framework Reference — Cache Abstraction
    url: https://docs.spring.io/spring-framework/reference/integration/cache.html
updated: 2026-09-24
---

## What is Redis Caching?

**Redis** is an in-memory key-value store. As a cache, it holds copies of expensive-to-compute data (query results, rendered fragments, remote API responses) so that later reads take a sub-millisecond network hop instead of a database round trip. The **database remains the source of truth**, and a cache entry may be lost at any time.

## How Caching Works: Common Patterns

| Pattern | Read | Write | Notes |
|---|---|---|---|
| **Cache-aside** (most common) | Check the cache → on a miss, load from the DB and store with a TTL | Write to the DB, then **evict** the key | What Spring `@Cacheable` / `@CacheEvict` do |
| Read-through | The cache loads on a miss itself | — | Needs a cache that knows the source |
| Write-through | — | Write to the cache and the DB together | Fresher, but write latency and a consistency burden |
| Write-behind | — | Write to the cache, flush to the DB later | Risk of data loss; rarely right for business data |

Eviction on write is usually safer than updating the cache on write. Two concurrent writers can otherwise leave the cache holding the older value.

## Spring Boot Implementation

```java
@Configuration
@EnableCaching
class CacheConfig {
  @Bean
  RedisCacheConfiguration cacheDefaults() {
    return RedisCacheConfiguration.defaultCacheConfig()
        .entryTtl(Duration.ofMinutes(10))                    // never cache forever
        .disableCachingNullValues()
        .serializeValuesWith(SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));
  }
}

@Service
class ProductService {
  @Cacheable(cacheNames = "product", key = "#tenantId + ':' + #id", sync = true)  // sync: one loader per key
  public ProductDto get(long tenantId, long id) { return repo.load(tenantId, id); }

  @Transactional
  @CacheEvict(cacheNames = "product", key = "#tenantId + ':' + #cmd.id()")
  public void update(long tenantId, UpdateProduct cmd) { repo.update(tenantId, cmd); }
}
```

Spring's `@CacheEvict` runs after the method returns, and with a transactional cache manager (`RedisCacheManager.builder(...).transactionAware()`) it runs after commit. Without that, an eviction followed by a rollback, or a concurrent read, can re-cache stale data.

## Common Mistakes

- **Keys missing a dimension.** Caching `user-profile` by `id` alone in a multi-tenant system can serve another tenant's data. That is a security bug, not only a correctness bug.
- **No TTL.** Stale data lives forever and memory grows without bound.
- **Forgetting an update path.** An admin endpoint or batch job writes to the database without evicting.
- **Caching before commit** or caching inside the transaction that might roll back.
- **Java native serialization.** It is brittle across deployments and a deserialization attack surface. Prefer JSON.
- **Redis outage equals site outage.** There is no timeout and no fallback. Configure short command timeouts and treat cache errors as misses (Spring `CacheErrorHandler`).
- **Cache stampede.** A hot key expires and 1,000 requests hit the database at once.
- **Using `KEYS *`** in application code. It blocks Redis. Use `SCAN` or structured key sets.

## Security Considerations

Do not cache secrets, tokens, or full personal records unless required. Enable Redis `requirepass`/ACLs and TLS, bind to private networks only, and namespace keys per application.

## Performance Considerations

Measure the **hit ratio**. A cache with a 20% hit ratio adds latency and complexity for little gain. Keep values small (kilobytes, not megabytes). Add TTL jitter to avoid synchronized expiry. Set `maxmemory` and `maxmemory-policy` (for example `allkeys-lru` for a pure cache).

## Testing

Run Redis with Testcontainers and assert these cases:

- The first call hits the repository and the second does not (a cache hit).
- An update evicts the entry, so the next read reloads it.
- With Redis stopped, the endpoint still works, only slower.
- Different tenants or users never share entries.

## Debugging

`redis-cli MONITOR` (development only) shows live commands. `INFO stats` gives `keyspace_hits` and `keyspace_misses`, `TTL key` checks expiry, and `MEMORY USAGE key` shows large values. If stale data appears, trace every write path to the cached entity.

## When to Use It

Use it for read-heavy data that is expensive to produce and tolerates brief staleness: product catalogues, configuration, permission lookups, rate-limit counters, and session or token deny-lists.

## When Not to Use It

Don't use it for data that must be strongly consistent (balances, inventory decrements) unless Redis *is* the system of record. Don't use it for write-heavy data with low reuse. And don't use it as a fix for a missing [database index](/database-indexing): add the index first.
