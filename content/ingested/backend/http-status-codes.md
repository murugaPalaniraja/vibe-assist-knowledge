---
id: http-status-codes
title: HTTP Status Codes for REST APIs
description: A reference of the HTTP status codes a REST API should use, when to use each one, and what a reviewer should check when a coding agent picks a status code…
summary: A reference of the HTTP status codes a REST API should use, when to use each one, and what a reviewer should check when a coding agent picks a status code. Use it alongside the REST API review checklist to spot APIs that return 200 for errors or 500 for validation failures.
category: backend
technology:
- REST APIs
concepts:
- HTTP status codes
- validation errors
- readiness probe
- REST APIs
- Service
- layer
- REST
difficulty: intermediate
tags:
- api
- http
- rest-apis
- status-codes
related:
- spring-boot-rest-api
- spring-boot-exception-handling
- kubernetes-basics
- docker-containers
- spring-security-jwt
origin: ingested
provenance:
  name: Vibe-Assist curated notes
  url: local/http-status-codes.csv
  retrieved_at: '2026-09-24'
  license: CC-BY-4.0
  source_type: csv
  content_hash: sha256:c06142b2471ebff44781b885f530f8e10b1cf6fe5bb25cf97e02e4e20f6f6162
  publish_mode: full
index: true
updated: '2026-09-24'
---

## HTTP Status Codes for REST APIs Reference Table

| Code | Name | Use when | Reviewer check |
|---|---|---|---|
| 200 | OK | A read or update succeeded and returns a body | Not used for errors with an error body |
| 201 | Created | A POST created a resource | Location header points to the new resource |
| 202 | Accepted | Work was queued for asynchronous processing | A status endpoint or callback exists |
| 204 | No Content | Success with no response body (e.g. DELETE) | No body is sent |
| 400 | Bad Request | Malformed JSON or failed validation | Field-level errors are returned in a consistent format |
| 401 | Unauthorized | Missing or invalid credentials or token | Returned by the security layer; no details on why validation failed |
| 403 | Forbidden | Authenticated but not allowed | Not confused with 401; consider 404 to hide existence of others' resources |
| 404 | Not Found | Resource does not exist or is hidden from this caller | Not used for validation errors |
| 409 | Conflict | Concurrent modification or unique-constraint conflict | Optimistic-locking failures map here and clients know to retry |
| 422 | Unprocessable Content | Well-formed request that violates a business rule | Used consistently if chosen instead of 400 |
| 429 | Too Many Requests | Rate limit exceeded | Retry-After header is set |
| 500 | Internal Server Error | Unexpected server failure | Generic message only; details logged with a correlation id |
| 503 | Service Unavailable | Dependency down or maintenance | Retry-After set; readiness probe reflects it |
