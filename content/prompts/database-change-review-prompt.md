---
id: database-change-review-prompt
title: Database Change and Migration Review Prompt
category: database-review
technology: [PostgreSQL, SQL]
purpose: Review schema migrations, queries and transaction code for data safety, locking, index support and rollback, before they reach a production database.
inputs: [project_context, migrations, changed_queries_or_repositories, table_sizes]
checks:
  - Migration safety (locks, table rewrites, backfills)
  - Backward compatibility with the running application version
  - Index support for new queries
  - Transaction boundaries and isolation
  - Rollback and recovery plan
output_format:
  - Migration risk table (statement | lock taken | duration risk | safe alternative)
  - Query/index findings
  - Deployment order and rollback plan
template: |
  CONTEXT
  {{project_context}}
  Approximate table sizes: {{table_sizes}}

  MIGRATIONS
  {{migrations}}

  QUERIES / REPOSITORIES
  {{changed_queries_or_repositories}}

  1. For each migration statement, state the lock it takes in PostgreSQL and whether it rewrites the table. Flag ADD COLUMN with a volatile default, ALTER COLUMN TYPE, CREATE INDEX without CONCURRENTLY, and adding NOT NULL or foreign keys without NOT VALID then VALIDATE.
  2. Check expand/contract compatibility: can the old application version run against the new schema during a rolling deploy?
  3. For each new or changed query, list its filters and sorts and whether an index supports them. Request EXPLAIN ANALYZE for anything on large tables.
  4. Check the transaction code: boundaries, rollback rules, lost-update protection, remote calls inside transactions.
  5. Provide a deployment order and a rollback plan, including for backfills.

  Label findings Confirmed, Potential risk or Needs verification.
related: [database-transactions, database-indexing, connection-pooling]
tags: [database, migrations, sql, postgresql]
updated: 2026-09-24
---

## When to Use This Prompt

Use it for every agent-written Flyway or Liquibase migration, and for any change to repositories or SQL on tables with real data volume.
