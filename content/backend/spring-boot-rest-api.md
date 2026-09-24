---
id: spring-boot-rest-api
title: Building REST APIs with Spring Boot
description: "Building REST APIs with Spring Boot: controllers, DTOs, validation, status codes and pagination, plus an API review checklist for agent code."
summary: A Spring Boot REST API exposes resources over HTTP through @RestController classes. A good API uses clear resource URLs, correct HTTP methods and status codes, validated request DTOs, consistent error bodies, and pagination for collections.
category: backend
technology: [Java, Spring Boot, REST APIs]
concepts: [REST, RestController, DTO, Bean Validation, HTTP status codes, pagination, idempotency, API versioning, OpenAPI]
difficulty: beginner
tags: [java, spring, rest, api, http]
vibe:
  understand: A REST API maps HTTP methods on resource URLs to operations, for example GET /orders/42 reads and POST /orders creates.
  learn: Learn @RestController, request/response DTOs, @Valid, ResponseEntity, Pageable and consistent error responses.
  review: Check status codes, validation, whether entities leak into responses, missing pagination, idempotency of PUT/DELETE, and authorization per endpoint.
  apply: Keep controllers thin, map entities to DTOs, validate at the edge, and document the contract with OpenAPI.
  prompt: Ask the agent to produce a table of every endpoint with method, path, request, response, status codes and required role.
review_checklist:
  - Endpoints use nouns and correct methods (GET safe, PUT/DELETE idempotent, POST creates)
  - Correct status codes (201 + Location on create, 204 on empty success, 400/404/409/422 on errors)
  - Request DTOs are validated with @Valid and Bean Validation constraints
  - JPA entities are not returned directly (no lazy-loading or over-exposure of fields)
  - Collection endpoints are paginated and have a max page size
  - Errors use one consistent format (e.g. RFC 9457 Problem Details)
  - Each endpoint has an authorization rule
  - Controllers contain no business logic or transactions
  - Breaking changes are versioned or avoided
  - Controller tests cover validation errors and not-found cases
related: [spring-boot-exception-handling, spring-dependency-injection, spring-security-jwt, spring-boot-testing, database-transactions]
prompts: [rest-api-review-prompt, feature-implementation-prompt]
sources:
  - title: Spring Framework Reference — Spring Web MVC
    url: https://docs.spring.io/spring-framework/reference/web/webmvc.html
  - title: RFC 9110 — HTTP Semantics
    url: https://www.rfc-editor.org/rfc/rfc9110
  - title: RFC 9457 — Problem Details for HTTP APIs
    url: https://www.rfc-editor.org/rfc/rfc9457
updated: 2026-09-24
---

## What is a REST API in Spring Boot?

**REST** (Representational State Transfer) models the system as **resources** identified by URLs and manipulated with standard HTTP methods. In Spring Boot, `@RestController` classes handle requests. Jackson serialises the return values to JSON, and `spring-boot-starter-web` wires everything together.

## How a Request Flows

1. The `DispatcherServlet` receives the request. Security filters run first.
2. Handler mapping finds the `@GetMapping`, `@PostMapping` or other mapping method.
3. Arguments are resolved: `@PathVariable`, `@RequestParam`, `@RequestBody` (deserialised and optionally validated with `@Valid`) and `Pageable`.
4. The controller calls a service. The service holds the business logic and transactions.
5. The return value is serialised, or an exception is translated by `@RestControllerAdvice`.

## Design Rules

| Operation | Method & path | Success status |
|---|---|---|
| List | `GET /api/orders?page=0&size=20` | 200 |
| Read | `GET /api/orders/{id}` | 200 / 404 |
| Create | `POST /api/orders` | 201 + `Location` |
| Replace | `PUT /api/orders/{id}` | 200 or 204 |
| Partial update | `PATCH /api/orders/{id}` | 200 |
| Delete | `DELETE /api/orders/{id}` | 204 |

## Code Example

```java
@RestController
@RequestMapping("/api/orders")
class OrderController {
  private final OrderService orders;
  OrderController(OrderService orders) { this.orders = orders; }

  @GetMapping("/{id}")
  OrderResponse get(@PathVariable long id) {
    return orders.find(id);                       // throws OrderNotFoundException -> 404
  }

  @GetMapping
  Page<OrderSummary> list(@PageableDefault(size = 20) Pageable page) {
    return orders.list(page);
  }

  @PostMapping
  ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest req, UriComponentsBuilder uri) {
    OrderResponse created = orders.create(req);
    return ResponseEntity.created(uri.path("/api/orders/{id}").build(created.id())).body(created);
  }
}

record CreateOrderRequest(@NotNull Long customerId, @NotEmpty List<@Valid Line> lines) {
  record Line(@NotBlank String sku, @Positive int quantity) {}
}
```

## Common Mistakes

- Returning JPA entities. This causes lazy-loading exceptions and infinite recursion, and exposes internal fields such as password hashes.
- Returning `200 OK` with `{"error": ...}` bodies, or `500` for validation errors.
- `findAll()` with no pagination on a table that will grow.
- Business logic and `@Transactional` in controllers.
- A `POST` retried by the client creates duplicates. Support an idempotency key for payment-like operations.
- Forgetting the `@Valid` annotation, which means the constraint annotations are never checked.

## Security Considerations

Authorise every endpoint (see [Spring Security JWT](/spring-security-jwt)). Check object-level access too: the user may read *their* order 42, not everyone's. This broken object-level authorization is the #1 risk in the OWASP API Security Top 10. Limit request sizes and page sizes.

## Performance Considerations

Paginate, avoid N+1 queries in the service layer, return only needed fields, and cache read-heavy reference data (see [Redis caching](/redis-caching)).

## Testing

Use `@WebMvcTest` with `MockMvc` for status codes, validation and JSON shape. Use `@SpringBootTest` with Testcontainers for the full path through the database (see [Spring Boot testing](/spring-boot-testing)).
