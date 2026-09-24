---
id: rest-api-pagination
title: REST API Pagination Patterns
description: Offset, cursor and keyset pagination for REST APIs, their trade-offs, and what to review when a coding agent adds pagination.
summary: Pagination splits a large collection into pages so that an API never returns an unbounded result set. Coding agents often add pagination as ?page=&size= with OFFSET, which works for small tables but degrades on large ones and returns inconsistent pages when data changes between requests.
category: backend
technology:
- REST APIs
concepts:
- Offset Pagination
- Cursor and Keyset Pagination
- composite index
- pagination
difficulty: intermediate
tags:
- api
- pagination
- rest
- rest-apis
related:
- spring-boot-rest-api
- spring-boot-exception-handling
- database-indexing
- spring-security-jwt
origin: ingested
provenance:
  name: Vibe-Assist curated notes
  url: local/rest-api-pagination.md
  retrieved_at: '2026-09-24'
  license: CC-BY-4.0
  source_type: markdown
  content_hash: sha256:a19a83ed0974ce0ac2320fe616c3ef4136bc98b86f3ae6cec65f22584beed1bb
  publish_mode: full
index: true
updated: '2026-09-24'
---

## Offset Pagination

The client sends `page` and `size` (or `offset` and `limit`), and the server runs `ORDER BY id LIMIT :size OFFSET :page * :size`.

- Easy to implement and supports jumping to page N.
- The database still reads and discards all skipped rows, so deep pages get slower.
- Inserts or deletes between requests shift rows, causing duplicates or gaps across pages.

## Cursor and Keyset Pagination

The server returns an opaque cursor that encodes the sort key of the last row, for example the `created_at` and `id` values. The next request asks for rows after that position: `WHERE (created_at, id) < (:c, :id) ORDER BY created_at DESC, id DESC LIMIT :size`.

- Constant cost per page when a matching composite index exists.
- Stable under concurrent inserts.
- Cannot jump to an arbitrary page number, which is usually acceptable for feeds and APIs.

## Response Shape

Return the items plus navigation metadata: `nextCursor` (or `next` link), and optionally `totalCount` only when it is cheap to compute. Counting a large table on every request is a common hidden cost.

## Review Checklist for Agent-Written Pagination

- A maximum page size is enforced on the server, regardless of what the client asks for.
- The sort order is deterministic, with a unique tie-breaker such as `id`.
- A composite index matches the filter and sort columns.
- Cursors are opaque and validated, and a tampered cursor returns 400, not 500.
- Total counts are optional or cached for large tables.
- Tests cover the first page, a middle page, the last page, an empty result and an invalid cursor.
