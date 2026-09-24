---
id: ref-postgresql-combining-multiple-indexes
title: PostgreSQL Combining Multiple Indexes
description: 'Reference note on PostgreSQL Combining Multiple Indexes from PostgreSQL documentation: topics, key concepts and related review checklists.'
summary: 'Reference note for “Combining Multiple Indexes” from PostgreSQL documentation: the topics it covers, its key concepts, and links to related Vibe Knowledge for reviewing agent-written code.'
category: databases
technology:
- PostgreSQL
- SQL
concepts:
- PostgreSQL
- B-tree
- step
difficulty: intermediate
tags:
- indexing
- performance
- postgresql
- sql
related:
- database-indexing
- connection-pooling
- database-transactions
- ci-cd-pipelines
- java-multithreading
sources:
- title: PostgreSQL documentation — Combining Multiple Indexes
  url: https://www.postgresql.org/docs/current/indexes-bitmap-scans.html
  license: PostgreSQL License
origin: ingested
provenance:
  name: PostgreSQL documentation
  url: https://www.postgresql.org/docs/current/indexes-bitmap-scans.html
  retrieved_at: '2026-09-24'
  license: PostgreSQL License
  source_type: url
  content_hash: sha256:9dca21e0769eb644a6fdee86808b12dc334157ca513dc48dfac4f362973430dc
  publish_mode: excerpt
index: false
updated: '2026-09-24'
---

## Overview

> A single index scan can only use query clauses that use the index's columns with operators of its operator class and are joined with AND.

— quoted from [PostgreSQL documentation](https://www.postgresql.org/docs/current/indexes-bitmap-scans.html)

## Key Concepts

- PostgreSQL
- B-tree
- step

## Read the Original

The complete, authoritative explanation is in [PostgreSQL documentation: Combining Multiple Indexes](https://www.postgresql.org/docs/current/indexes-bitmap-scans.html) (license: PostgreSQL License). This note only maps the source to Vibe Knowledge; related articles and review checklists are linked below.
