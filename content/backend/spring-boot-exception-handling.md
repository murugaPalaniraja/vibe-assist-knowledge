---
id: spring-boot-exception-handling
title: Spring Boot Exception Handling for REST APIs
description: Centralised REST error handling in Spring Boot with @RestControllerAdvice and ProblemDetail (RFC 9457), plus a checklist for agent code.
summary: Spring Boot APIs should translate exceptions into consistent HTTP error responses in one place, a @RestControllerAdvice. Spring 6's ProblemDetail implements the RFC 9457 format, so clients get a predictable status, title and detail without leaked internals.
category: backend
technology: [Java, Spring Boot, REST APIs]
concepts: [RestControllerAdvice, ExceptionHandler, ProblemDetail, RFC 9457, ResponseStatusException, validation errors, error logging]
difficulty: intermediate
tags: [java, spring, error-handling, rest, api]
vibe:
  understand: Exceptions thrown anywhere in a request are caught by a central advice and turned into an HTTP status plus a structured body.
  learn: Learn @RestControllerAdvice, @ExceptionHandler, ProblemDetail, ResponseEntityExceptionHandler, and how security errors are handled separately.
  review: Check that unexpected exceptions return a generic 500 without stack traces, that validation errors return 400 with field details, and that errors are logged once.
  apply: Define a few domain exceptions (NotFound, Conflict, BusinessRule) and map them in one advice to ProblemDetail responses.
  prompt: Ask the agent for a table mapping each exception type to status code, response body and log level.
review_checklist:
  - One global @RestControllerAdvice; no try/catch-to-ResponseEntity in every controller
  - Unexpected exceptions return 500 with a generic message; no stack traces or SQL in responses
  - Validation failures (MethodArgumentNotValidException) return 400 with field-level errors
  - Not-found → 404, conflicts/optimistic locking → 409, business-rule violations → 422 (or a documented choice)
  - Errors are logged once, at the right level (4xx usually WARN/INFO, 5xx ERROR with stack trace)
  - server.error.include-stacktrace and include-message are not enabled in production
  - Security exceptions (401/403) are handled by the security entry point, not the advice
  - Error responses include a correlation/trace id
related: [java-exception-handling, spring-boot-rest-api, spring-security-jwt, spring-boot-testing]
prompts: [rest-api-review-prompt, bug-fix-root-cause-prompt]
sources:
  - title: Spring Framework Reference — Error Responses (ProblemDetail)
    url: https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html
  - title: RFC 9457 — Problem Details for HTTP APIs
    url: https://www.rfc-editor.org/rfc/rfc9457
updated: 2026-09-24
---

## What is Centralised Exception Handling?

Rather than catching errors in every controller, you let domain and framework exceptions propagate. A single `@RestControllerAdvice` translates each one into an HTTP response. Clients see one consistent error shape, and controllers stay focused on the happy path.

## How It Works

1. An exception escapes the controller or service.
2. `ExceptionHandlerExceptionResolver` finds the most specific `@ExceptionHandler` in the controller or in an advice.
3. The handler returns a `ProblemDetail` or `ResponseEntity`, which is serialised as `application/problem+json`.
4. Exceptions thrown **inside security filters** never reach the advice. The `AuthenticationEntryPoint` and `AccessDeniedHandler` handle those.

## Code Example

```java
@RestControllerAdvice
class ApiExceptionHandler extends ResponseEntityExceptionHandler {   // handles Spring MVC exceptions too

  private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

  @ExceptionHandler(OrderNotFoundException.class)
  ProblemDetail notFound(OrderNotFoundException e) {
    ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    pd.setTitle("Order not found");
    return pd;
  }

  @ExceptionHandler(OptimisticLockingFailureException.class)
  ProblemDetail conflict() {
    return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "The resource was modified concurrently. Retry.");
  }

  @ExceptionHandler(Exception.class)
  ProblemDetail unexpected(Exception e) {
    log.error("Unhandled error", e);                  // log once, with stack trace
    return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error");
  }
}
```

Enable RFC 9457 bodies for Spring's built-in exceptions with `spring.mvc.problemdetails.enabled=true`, or by extending `ResponseEntityExceptionHandler` as shown above.

## Common Mistakes

- **Returning `e.getMessage()` from unexpected exceptions.** This leaks SQL, class names or file paths.
- **Mapping everything to 500 or everything to 400.** Clients can no longer tell whether a retry makes sense.
- **Catching in the controller and returning `null` or an empty body.**
- **Logging in both the service and the advice**, which produces duplicate stack traces.
- **Expecting the advice to handle JWT errors.** They happen in the filter chain, before the controller.

## Security Considerations

Error bodies must never include tokens, credentials, stack traces or internal hostnames. Keep `server.error.include-stacktrace=never` in production. For login endpoints, use the same message for "user unknown" and "wrong password".

## Testing

In a `@WebMvcTest`, make a mocked service throw each domain exception, then assert the status, `Content-Type: application/problem+json` and the `title`/`detail` fields. Also assert that a generic `RuntimeException` produces a 500 **without** the original message.

## Debugging

If you get an unexpected Whitelabel or HTML error page, the exception happened outside MVC (in a filter) or no handler matched. Enable `logging.level.org.springframework.web=DEBUG` locally.
