---
id: rest-api-review-prompt
title: REST API Review Prompt
category: api-review
technology: [REST APIs, Spring Boot]
purpose: Review new or changed REST endpoints for correct HTTP semantics, validation, error format, pagination, authorization and backward compatibility.
inputs: [project_context, changed_controllers, dtos, api_consumers]
checks:
  - Endpoint inventory with methods, paths and status codes
  - Request validation and error format
  - Object-level authorization
  - Pagination and limits
  - Backward compatibility for existing consumers
  - Idempotency of retries
output_format:
  - Endpoint table (method | path | request | responses | auth rule)
  - Findings with classification
  - Contract changes that may break consumers
template: |
  CONTEXT
  {{project_context}}
  Known API consumers: {{api_consumers}}

  CONTROLLERS
  {{changed_controllers}}

  DTOS
  {{dtos}}

  1. Produce an endpoint table: method, path, request body, success status, error statuses, required authority.
  2. Check HTTP semantics: safe or idempotent methods, 201 plus Location on create, 204 when there is no body, 404 vs 403 for other users' resources.
  3. Check validation: which fields are validated, and whether @Valid (or the equivalent) is actually applied.
  4. Check errors: is the format consistent (for example RFC 9457 ProblemDetail), and are internals kept out of the responses?
  5. Check object-level authorization: can user A access user B's resource by changing an ID?
  6. Check collections: pagination, maximum page size, stable sorting.
  7. Check compatibility: removed or renamed fields, changed types, new required fields.

  Label findings Confirmed, Potential risk or Needs verification, and cite file:line.
related: [spring-boot-rest-api, spring-boot-exception-handling, spring-security-jwt]
tags: [api, rest, http, review]
updated: 2026-09-24
---

## When to Use This Prompt

Use it for any change to controllers, DTOs or API documentation, and especially before exposing an API to external consumers.
