---
id: database-indexing
title: Database Indexing and Query Performance
description: How PostgreSQL indexes work, composite column order, EXPLAIN ANALYZE, and a checklist for reviewing indexes and queries from coding agents.
summary: An index is a separate data structure that lets the database find rows without scanning the whole table. The right indexes make reads fast, but every index costs write time and storage, so indexes should match real query patterns.
category: databases
technology: [PostgreSQL, SQL]
concepts: [B-tree, composite index, selectivity, covering index, partial index, EXPLAIN ANALYZE, sequential scan, N+1 queries]
difficulty: intermediate
tags: [database, sql, postgresql, indexing, performance]
vibe:
  understand: An index is like a sorted lookup table from column values to row locations, so the database can jump straight to matching rows.
  learn: Learn B-tree indexes, composite column order (equality first, then range), partial and covering indexes, and how to read EXPLAIN ANALYZE.
  review: Check new queries for a supporting index, new indexes for a real query, migrations that lock large tables, and ORM code with N+1 queries.
  apply: Index foreign keys and frequent filters, measure with EXPLAIN (ANALYZE, BUFFERS), and create indexes CONCURRENTLY in production.
  prompt: Ask the agent to show EXPLAIN ANALYZE output for each new or changed query against realistic data volume.
review_checklist:
  - New WHERE / JOIN / ORDER BY patterns on large tables have a supporting index
  - Composite index column order matches the query (equality columns before range/sort columns)
  - Foreign-key columns used in joins or cascaded deletes are indexed
  - Indexes on large production tables are created CONCURRENTLY (outside a transaction)
  - No duplicate or unused indexes added "just in case"
  - Queries do not wrap indexed columns in functions (lower(email)) unless an expression index exists
  - ORM access patterns avoid N+1 (fetch joins, entity graphs, batch fetching)
  - EXPLAIN ANALYZE was checked on realistic data, not an empty dev database
related: [database-transactions, connection-pooling, redis-caching, spring-boot-rest-api]
prompts: [database-change-review-prompt, performance-review-prompt]
sources:
  - title: PostgreSQL Documentation — Indexes
    url: https://www.postgresql.org/docs/current/indexes.html
  - title: PostgreSQL Documentation — Using EXPLAIN
    url: https://www.postgresql.org/docs/current/using-explain.html
  - title: PostgreSQL Documentation — CREATE INDEX (CONCURRENTLY)
    url: https://www.postgresql.org/docs/current/sql-createindex.html
updated: 2026-09-24
---

## What is an Index?

An index is an auxiliary structure, a **B-tree** by default in PostgreSQL. It maps column values to row locations (TIDs). The planner can use it to satisfy `WHERE`, `JOIN`, `ORDER BY` and sometimes the entire query (an *index-only scan*).

## How Indexes Work

- A **B-tree** keeps keys sorted, which supports `=`, `<`, `>`, `BETWEEN`, prefix `LIKE 'abc%'` and ordering.
- **Composite indexes** `(a, b, c)` are usable for filters on `a`, `a,b` or `a,b,c`, but not on `b` alone.
- **Selectivity** matters. The planner prefers a sequential scan when a filter matches a large fraction of rows.
- Other index types: **GIN** (JSONB, arrays, full-text search), **GiST** (geometric data, ranges), **BRIN** (huge append-only tables ordered by time).

## Implementation Concepts

```sql
-- Query: recent orders for a customer
SELECT id, total FROM orders
WHERE customer_id = $1 AND status = 'PAID'
ORDER BY created_at DESC LIMIT 20;

-- Equality columns first, then the sort column:
CREATE INDEX CONCURRENTLY idx_orders_customer_status_created
  ON orders (customer_id, status, created_at DESC);

-- Partial index when most rows are irrelevant:
CREATE INDEX CONCURRENTLY idx_orders_pending ON orders (created_at) WHERE status = 'PENDING';

-- Expression index for case-insensitive lookup:
CREATE UNIQUE INDEX idx_users_email_lower ON users (lower(email));
```

## Reading EXPLAIN ANALYZE

Run `EXPLAIN (ANALYZE, BUFFERS) <query>` and look for:

- `Seq Scan` on a big table with a selective filter, which usually means an index is missing.
- Estimated vs actual row counts that are far apart. That means stale statistics, so run `ANALYZE`.
- `Rows Removed by Filter` in the thousands after an index scan, which means the index column order is wrong.
- A nested loop with a large outer side.

## Common Mistakes

- Adding an index for every column. Each one slows `INSERT`/`UPDATE` and uses memory.
- `CREATE INDEX` without `CONCURRENTLY` in a migration on a large table. It blocks writes for minutes. Note that Flyway and Liquibase need the migration to run outside a transaction for this.
- Filtering on `lower(email)` or `created_at::date` without a matching expression index.
- The ORM N+1 pattern: loading 100 orders and then lazily loading each customer, which means 101 queries.
- Benchmarking on a 50-row dev database, where every plan looks fast.

## Testing and Debugging

Enable `pg_stat_statements` to find the slowest and most frequent queries. `pg_stat_user_indexes.idx_scan = 0` over a long period points to unused indexes. For ORM code, log SQL in tests and assert the query count for critical endpoints.

## When Not to Add an Index

Skip it for tiny tables, for columns with very low selectivity (a boolean where half the rows are true) unless you use a partial index, and for write-heavy tables where the query is rare.
