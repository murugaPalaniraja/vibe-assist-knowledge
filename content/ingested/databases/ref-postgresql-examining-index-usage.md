---
id: ref-postgresql-examining-index-usage
title: PostgreSQL Examining Index Usage
description: 'Reference note on PostgreSQL Examining Index Usage from PostgreSQL documentation: topics, key concepts and related review checklists.'
summary: 'Reference note for “Examining Index Usage” from PostgreSQL documentation: the topics it covers, its key concepts, and links to related Vibe Knowledge for reviewing agent-written code.'
category: databases
technology:
- PostgreSQL
- SQL
concepts:
- EXPLAIN ANALYZE
- sequential scan
- selectivity
- PostgreSQL
- test data
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
- java-multithreading
- python-async-multiprocessing
sources:
- title: PostgreSQL documentation — Examining Index Usage
  url: https://www.postgresql.org/docs/current/indexes-examine.html
  license: PostgreSQL License
origin: ingested
provenance:
  name: PostgreSQL documentation
  url: https://www.postgresql.org/docs/current/indexes-examine.html
  retrieved_at: '2026-09-24'
  license: PostgreSQL License
  source_type: url
  content_hash: sha256:fad01dbe5b29a0b35b06818ba3400c594b70d9e23906191477f1533f43c81ede
  publish_mode: excerpt
index: false
updated: '2026-09-24'
---

## Overview

> Although indexes in PostgreSQL do not need maintenance or tuning, it is still important to check which indexes are actually used by the real-life query workload.

— quoted from [PostgreSQL documentation](https://www.postgresql.org/docs/current/indexes-examine.html)

## Key Concepts

- EXPLAIN ANALYZE
- sequential scan
- selectivity
- PostgreSQL
- test data

## Read the Original

The complete, authoritative explanation is in [PostgreSQL documentation: Examining Index Usage](https://www.postgresql.org/docs/current/indexes-examine.html) (license: PostgreSQL License). This note only maps the source to Vibe Knowledge; related articles and review checklists are linked below.
