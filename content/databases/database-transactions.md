---
id: database-transactions
title: Database Transactions, ACID and Isolation Levels
description: ACID transactions, isolation levels and anomalies in PostgreSQL, Spring @Transactional pitfalls, and a checklist for reviewing transaction code written by coding agents.
summary: A transaction groups database operations so they succeed or fail together. Isolation levels control which concurrent anomalies are possible, and application frameworks like Spring decide where transactions begin, commit and roll back.
category: databases
technology: [PostgreSQL, SQL, Spring Boot]
concepts: [ACID, isolation levels, read committed, repeatable read, serializable, lost update, optimistic locking, pessimistic locking, "@Transactional", rollback rules]
difficulty: intermediate
tags: [database, sql, postgresql, transactions, spring]
vibe:
  understand: A transaction makes several writes all-or-nothing, and isolation decides what concurrent transactions can see of each other.
  learn: Learn ACID, PostgreSQL isolation levels, lost updates, optimistic (@Version) vs pessimistic (SELECT ... FOR UPDATE) locking, and Spring's propagation and rollback rules.
  review: Check transaction boundaries, rollback on checked exceptions, remote calls inside transactions, read-modify-write races, and long transactions.
  apply: Put @Transactional on service methods, keep transactions short, use @Version for concurrent edits, and retry serialization failures.
  prompt: Ask the agent to mark where each transaction starts and ends and what happens if two users run the same operation concurrently.
review_checklist:
  - item: Transaction boundaries are on service methods that represent one business operation
  - item: Rollback rules cover checked exceptions (rollbackFor) where needed
    why: By default Spring rolls back only on RuntimeException and Error.
  - item: No HTTP calls, message sends or slow I/O inside an open transaction
    why: They hold connections and locks; use the outbox pattern or after-commit hooks.
  - item: Read-modify-write sequences are protected (optimistic @Version, SELECT FOR UPDATE, or atomic UPDATE ... SET x = x - 1)
  - item: Isolation level is the default unless a specific anomaly requires more; serialization failures are retried
  - item: "@Transactional is not bypassed by self-invocation or private methods"
  - item: readOnly = true on query-only methods
  - item: Transactions are short; no user think-time or batch loops over thousands of rows in one transaction
  - item: Cache updates and events happen after commit, not before
related: [database-indexing, connection-pooling, redis-caching, spring-dependency-injection, spring-boot-rest-api]
prompts: [database-change-review-prompt, concurrency-review-prompt]
sources:
  - title: PostgreSQL Documentation — Transaction Isolation
    url: https://www.postgresql.org/docs/current/transaction-iso.html
  - title: Spring Framework Reference — Declarative Transaction Management
    url: https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative.html
updated: 2026-09-24
---

## What is a Transaction?

A **transaction** is a unit of work with **ACID** guarantees:

- **Atomicity.** All statements commit, or none do.
- **Consistency.** Constraints hold before and after the transaction.
- **Isolation.** Concurrent transactions don't interfere beyond what the isolation level allows.
- **Durability.** Committed data survives a crash.

## Isolation Levels in PostgreSQL

| Level | Prevents | Still possible | Notes |
|---|---|---|---|
| Read Committed (default) | Dirty reads | Non-repeatable reads, lost updates, write skew | Each statement sees a fresh snapshot |
| Repeatable Read | + non-repeatable reads, phantoms | Write skew | Concurrent update → serialization error |
| Serializable | All anomalies | — | Must retry on `40001` serialization failures |

## The Lost-Update Problem

Two requests read `stock = 5`, each subtracts 1 in Java, and both write `4`. At Read Committed this is **allowed**. The fixes:

```sql
-- 1. Atomic update in SQL
UPDATE product SET stock = stock - 1 WHERE id = :id AND stock > 0;

-- 2. Pessimistic lock
SELECT stock FROM product WHERE id = :id FOR UPDATE;
```

```java
// 3. Optimistic locking with JPA: the UPDATE includes "WHERE version = ?"
@Entity class Product { @Id Long id; int stock; @Version long version; }
// A concurrent change throws OptimisticLockingFailureException -> return 409 or retry
```

## Spring @Transactional Essentials

- It works through a proxy: only **public** methods called **from another bean** are transactional (see [Spring DI](/spring-dependency-injection)).
- It rolls back on unchecked exceptions only, unless you add `rollbackFor = Exception.class`.
- `Propagation.REQUIRED` (the default) joins an existing transaction. `REQUIRES_NEW` suspends it and uses a *second connection*.
- `readOnly = true` enables driver and Hibernate optimisations and documents intent.

## Common Mistakes

- **Calling a payment API inside a transaction.** If the commit then fails, the customer is charged anyway. If the API is slow, connections pile up.
- **Evicting or updating a cache before commit.** A rollback leaves the cache inconsistent. Use `@TransactionalEventListener(phase = AFTER_COMMIT)`.
- **Catching an exception inside the transaction and continuing.** Hibernate marks the transaction rollback-only, which later causes `UnexpectedRollbackException`.
- **One giant transaction around a batch import**, which holds locks for minutes.
- **`REQUIRES_NEW` in loops**, which can exhaust the [connection pool](/connection-pooling).

## Testing

Test concurrency explicitly. Run two threads that update the same row and assert that exactly one succeeds or that the final value is correct. Use a real PostgreSQL via Testcontainers, because H2 locking behaviour differs.

## Debugging

In PostgreSQL, `pg_stat_activity` shows sessions that are `idle in transaction`, which usually means a leaked or long transaction. `pg_locks` joined with `pg_stat_activity` reveals blockers.
