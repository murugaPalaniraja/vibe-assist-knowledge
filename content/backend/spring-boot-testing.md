---
id: spring-boot-testing
title: Testing Spring Boot Applications
description: Unit tests, slice tests (@WebMvcTest, @DataJpaTest), @SpringBootTest and Testcontainers in Spring Boot, and how to judge tests written by an AI coding agent.
summary: Spring Boot testing combines fast unit tests of plain classes, slice tests that load one layer, and a smaller number of full integration tests against real infrastructure via Testcontainers. The goal is confidence in behaviour, not a coverage number.
category: backend
technology: [Java, Spring Boot]
concepts: [unit test, slice test, WebMvcTest, DataJpaTest, SpringBootTest, Testcontainers, MockMvc, mocking, test data]
difficulty: intermediate
tags: [java, spring, testing, junit, testcontainers]
vibe:
  understand: Each test type trades speed for realism. Unit tests are fast and isolated, while integration tests exercise real wiring, SQL and security.
  learn: Learn JUnit 5, AssertJ, Mockito, @WebMvcTest, @DataJpaTest, @SpringBootTest and Testcontainers with @ServiceConnection.
  review: Check whether agent tests assert behaviour or only mocks, whether negative paths exist, and whether H2 is standing in for PostgreSQL-specific behaviour.
  apply: Unit-test domain logic, slice-test controllers and repositories, and run a few end-to-end tests against real PostgreSQL and Redis containers.
  prompt: Ask the agent which requirement each test proves and to add the missing failure-path tests.
review_checklist:
  - Tests assert observable behaviour (responses, state, events), not just verify(mock).method()
  - Failure paths are tested (validation errors, not found, unauthorized, conflicts)
  - Security is tested through the real filter chain for at least one case, not only @WithMockUser
  - Database tests use the same engine as production (Testcontainers), not H2, when SQL behaviour matters
  - Tests are independent (no order dependence, shared mutable fixtures or leftover data)
  - No Thread.sleep; use Awaitility for async assertions
  - Mocks are used at boundaries (HTTP clients, clocks), not for the class under test
  - The test suite actually fails when the feature is broken (mutation check or quick manual break)
related: [testing-strategy, spring-boot-rest-api, spring-security-jwt, database-transactions, code-review]
prompts: [test-generation-prompt, agent-change-review-prompt]
sources:
  - title: Spring Boot Reference — Testing
    url: https://docs.spring.io/spring-boot/reference/testing/index.html
  - title: Testcontainers for Java
    url: https://java.testcontainers.org/
updated: 2026-09-24
---

## What is Spring Boot Testing?

`spring-boot-starter-test` bundles JUnit 5, AssertJ, Mockito, Spring Test and JSONPath. On top of plain unit tests, Spring provides **test slices**, which load only one layer of the application context, and `@SpringBootTest` for the full context.

## Test Types

| Type | Annotation | Loads | Use for |
|---|---|---|---|
| Unit | none | Nothing | Domain logic, services with fakes |
| Web slice | `@WebMvcTest(OrderController.class)` | MVC + security, controllers | Status codes, validation, JSON |
| JPA slice | `@DataJpaTest` | JPA, repositories | Queries, mappings |
| Integration | `@SpringBootTest` + Testcontainers | Everything | Critical end-to-end flows |

## Code Example

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest {
  @Autowired MockMvc mvc;
  @MockitoBean OrderService orders;      // Spring Boot 3.4+ (replaces @MockBean)

  @Test
  void rejectsOrderWithoutLines() throws Exception {
    mvc.perform(post("/api/orders").with(jwt())
            .contentType(APPLICATION_JSON).content("{\"customerId\":1,\"lines\":[]}"))
       .andExpect(status().isBadRequest());
  }
}

@SpringBootTest
@Testcontainers
class OrderFlowIT {
  @Container @ServiceConnection
  static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16-alpine");
  // real Flyway migrations, real SQL, real transactions
}
```

## Common Mistakes in Agent-Written Tests

- **Tautological tests.** The test mocks the repository to return X, then asserts the service returned X. It proves nothing about the logic.
- **Only happy paths.** An agent that says "added tests" often means one success case.
- **`@WithMockUser` everywhere.** It skips JWT validation, so a broken security config still passes.
- **H2 instead of PostgreSQL.** Different SQL dialect, locking and constraint behaviour.
- **`@SpringBootTest` for everything.** The suite becomes slow and people stop running it.
- **Asserting log output or private methods** instead of behaviour.

## Performance Considerations

Spring caches application contexts between tests that share the same configuration. Each different `@MockitoBean` combination creates a new context, so keep mock sets consistent. Reuse containers across test classes with static containers or singleton patterns.

## Debugging

A test that passes only in isolation usually shares state (database rows, static fields, a cached context with mutated beans). Run with a random order (`junit.jupiter.testmethod.order.default`) to expose order dependence.

## When Not to Use @SpringBootTest

Don't use it for logic that doesn't need Spring. A plain `new Service(fakes)` test runs in milliseconds and pins behaviour more precisely.
