---
id: connection-pooling
title: Database Connection Pooling (HikariCP)
description: How database connection pools like HikariCP work, how to size them, timeouts, leaks and pool exhaustion, and what to review when a coding agent changes pool settings.
summary: A connection pool keeps a set of open database connections and lends them to application threads, avoiding the high cost of opening a connection per request. Correct sizing and timeouts keep the application fast and protect the database.
category: databases
technology: [Java, Spring Boot, PostgreSQL]
concepts: [connection pool, HikariCP, pool size, connection timeout, max lifetime, leak detection, pool exhaustion, PgBouncer]
difficulty: intermediate
tags: [database, performance, hikaricp, postgresql, spring]
vibe:
  understand: Opening a database connection is slow, so a pool keeps connections open and hands them out briefly per transaction.
  learn: Learn HikariCP settings (maximumPoolSize, connectionTimeout, maxLifetime), pool sizing, and how long transactions cause exhaustion.
  review: Look for inflated pool sizes, missing timeouts, connections held across remote calls, and total connections across all instances exceeding the database limit.
  apply: Start small (about 10 per instance), keep transactions short, set connectionTimeout low, and monitor pool metrics.
  prompt: Ask the agent to calculate total connections (instances × pool size) against the database max_connections and justify the pool size.
review_checklist:
  - maximumPoolSize is justified and (instances × pool size) stays below database max_connections minus headroom
  - connectionTimeout is short enough to fail fast (seconds, not minutes)
  - maxLifetime is shorter than any database/proxy idle kill timeout
  - Connections are not held during HTTP calls or other slow I/O
  - Manually obtained connections (DataSource.getConnection) are closed with try-with-resources
  - leakDetectionThreshold is enabled in non-production environments
  - Pool metrics (active, idle, pending) are exported and alerted on
related: [database-transactions, database-indexing, java-multithreading, kubernetes-basics]
prompts: [performance-review-prompt, database-change-review-prompt]
sources:
  - title: HikariCP — README and configuration
    url: https://github.com/brettwooldridge/HikariCP
  - title: HikariCP Wiki — About Pool Sizing
    url: https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing
  - title: PostgreSQL Documentation — Connections and Authentication (max_connections)
    url: https://www.postgresql.org/docs/current/runtime-config-connection.html
updated: 2026-09-24
---

## What is Connection Pooling?

Creating a PostgreSQL connection involves a TCP handshake, TLS, authentication and a new backend process on the server, which adds up to milliseconds each time. A **connection pool** opens connections once and reuses them. Spring Boot uses **HikariCP** by default.

## How It Works

1. A thread asks the pool for a connection. Starting a `@Transactional` method does this implicitly.
2. If an idle connection exists, it is returned immediately. Otherwise the thread waits up to `connectionTimeout`.
3. When the transaction ends, the connection goes **back to the pool**. It is not closed.
4. The pool retires connections after `maxLifetime` and validates them before reuse.

## Sizing the Pool

More connections is **not** more throughput. Each PostgreSQL connection is a process competing for CPU and disk. HikariCP's guidance starts from `connections ≈ (core_count × 2) + effective_spindle_count` on the *database* server, and the total is shared by **all** application instances.

Example: 6 pods × `maximumPoolSize: 50` means 300 connections, against a database with `max_connections = 100`. Under load you get connection refusals, or a thrashing database.

## Implementation Concepts

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10        # per instance; multiply by replicas
      minimum-idle: 10             # fixed-size pool is simplest
      connection-timeout: 3000     # ms; fail fast instead of piling up requests
      max-lifetime: 1500000        # 25 min; below any LB/DB idle kill
      leak-detection-threshold: 20000   # dev/staging: log connections held > 20 s
```

With many instances or serverless functions, put **PgBouncer** (transaction pooling) in front of PostgreSQL.

## Common Mistakes

- Raising `maximumPoolSize` to 100+ to "fix" timeouts caused by slow queries or long transactions.
- Holding a connection while calling an external API inside `@Transactional`.
- `connectionTimeout` of 30 s or more (the default is 30 s), which makes a pool problem look like a slow API.
- Leaked connections from `getConnection()` without `close()`.
- Pools sized for virtual threads. Thousands of concurrent tasks still share about 10 connections, so add a semaphore or bulkhead in front of the pool.

## Debugging Pool Exhaustion

The symptom is `SQLTransientConnectionException: Connection is not available, request timed out after 3000ms`. Check `hikaricp_connections_pending` and `active`, then check `pg_stat_activity` for slow or `idle in transaction` sessions. The root cause is usually a slow query ([indexing](/database-indexing)) or a long [transaction](/database-transactions), not the pool size.

## Testing

Load-test with realistic concurrency and watch pool metrics. Add an integration test with a tiny pool (size 2) so that connection leaks show up as timeouts in CI.
