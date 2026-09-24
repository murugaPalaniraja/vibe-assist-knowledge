---
id: java-exception-handling
title: Java Exception Handling Best Practices
description: Checked vs unchecked exceptions, try-with-resources, exception translation and logging in Java, with a checklist for reviewing agent-written error handling.
summary: Java exceptions signal that an operation could not complete. Good exception handling preserves the cause, releases resources, translates low-level errors at layer boundaries, and handles an error once, in the place that can actually act on it.
category: programming
technology: [Java]
concepts: [checked exceptions, unchecked exceptions, try-with-resources, exception chaining, exception translation, fail fast]
difficulty: beginner
tags: [java, exceptions, error-handling]
vibe:
  understand: An exception unwinds the stack until a matching catch block. Catching it means claiming you can handle it.
  learn: Learn checked vs unchecked exceptions, try-with-resources, exception chaining with a cause, and where to translate exceptions between layers.
  review: Hunt for empty catch blocks, catch (Exception e) that hides bugs, lost causes, and log-and-rethrow duplication.
  apply: Let exceptions propagate to a central handler, wrap them with context at boundaries, and use try-with-resources for anything closeable.
  prompt: Ask the agent to list every catch block it added and say what happens to the error in each one.
review_checklist:
  - No empty catch blocks and no catch-and-ignore without a comment explaining why
  - "Broad catch (Exception | Throwable) is limited to top-level boundaries"
  - Wrapped exceptions keep the original cause (new XException("context", e))
  - Each error is logged once, not logged and rethrown at every layer
  - Resources (streams, connections, locks) are released with try-with-resources or finally
  - Exceptions are not used for normal control flow
  - Error messages include useful context but no secrets or personal data
  - InterruptedException restores the interrupt flag
related: [spring-boot-exception-handling, java-multithreading, spring-boot-rest-api]
prompts: [agent-change-review-prompt, bug-fix-root-cause-prompt]
sources:
  - title: The Java Tutorials — Exceptions
    url: https://docs.oracle.com/javase/tutorial/essential/exceptions/
  - title: The Java Tutorials — The try-with-resources Statement
    url: https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html
updated: 2026-09-24
---

## What is Exception Handling?

Java separates **checked exceptions** (subclasses of `Exception` but not `RuntimeException`), which must be declared or caught, from **unchecked exceptions** (`RuntimeException` and `Error`), which need not be. Exception handling is deciding *where* each kind of failure is detected, translated and finally dealt with.

## How It Works

When code throws, the JVM unwinds stack frames until it finds a `catch` for that type. `finally` blocks and try-with-resources close actions run during unwinding. Every exception can carry a **cause**, which forms a chain that appears in stack traces as `Caused by:`.

## Implementation Concepts

- **Handle where you can act.** A repository cannot decide what HTTP status to return, but a controller advice can.
- **Translate at boundaries.** Wrap `SQLException` in a domain or data-access exception with context, and keep the cause.
- **Fail fast** on invalid arguments with `IllegalArgumentException` or `Objects.requireNonNull`.
- **Centralise** handling for web requests (see [Spring Boot exception handling](/spring-boot-exception-handling)).

## Common Mistakes

```java
try { process(order); }
catch (Exception e) { }                                  // swallowed: bug becomes silent data loss

catch (IOException e) { throw new RuntimeException("failed"); } // cause lost

catch (SQLException e) { log.error("db", e); throw e; }  // logged here AND by every caller
```

- Catching `Exception` also catches `NullPointerException` and other programming bugs, and hides them.
- Returning `null` or `-1` from a catch block pushes the problem to a caller that doesn't know about it.
- Putting user input or tokens in exception messages that end up in logs.

## Code Example

```java
public Invoice load(Path file) {
  try (BufferedReader in = Files.newBufferedReader(file)) {   // always closed
    return parser.parse(in);
  } catch (IOException e) {
    throw new InvoiceImportException("Cannot read invoice " + file.getFileName(), e); // context + cause
  }
}
```

## Testing

Assert on the type **and** the cause with `assertThrows(InvoiceImportException.class, ...)`, then check `getCause()`. Test the unhappy paths an agent is likely to skip: missing file, malformed input, timeout.

## Debugging

Read stack traces bottom-up through the `Caused by:` chain. The root cause is usually the last one. If the chain is missing, look for a `catch` that dropped `e`.
