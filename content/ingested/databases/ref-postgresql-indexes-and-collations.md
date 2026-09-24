---
id: ref-postgresql-indexes-and-collations
title: PostgreSQL Indexes and Collations
description: 'Reference note on PostgreSQL Indexes and Collations from PostgreSQL documentation: topics, key concepts and related review checklists.'
summary: 'Reference note for “Indexes and Collations” from PostgreSQL documentation: the topics it covers, its key concepts, and links to related Vibe Knowledge for reviewing agent-written code.'
category: databases
technology:
- PostgreSQL
- SQL
concepts:
- PostgreSQL
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
- title: PostgreSQL documentation — Indexes and Collations
  url: https://www.postgresql.org/docs/current/indexes-collations.html
  license: PostgreSQL License
origin: ingested
provenance:
  name: PostgreSQL documentation
  url: https://www.postgresql.org/docs/current/indexes-collations.html
  retrieved_at: '2026-09-24'
  license: PostgreSQL License
  source_type: url
  content_hash: sha256:686fb355fa24b2670a609f46c81bc83622041f345d5dee313af23441bd5fb170
  publish_mode: excerpt
index: false
updated: '2026-09-24'
---

## Overview

> An index can support only one collation per index column. If multiple collations are of interest, multiple indexes may be needed.

— quoted from [PostgreSQL documentation](https://www.postgresql.org/docs/current/indexes-collations.html)

## Key Concepts

- PostgreSQL

## Read the Original

The complete, authoritative explanation is in [PostgreSQL documentation: Indexes and Collations](https://www.postgresql.org/docs/current/indexes-collations.html) (license: PostgreSQL License). This note only maps the source to Vibe Knowledge; related articles and review checklists are linked below.
