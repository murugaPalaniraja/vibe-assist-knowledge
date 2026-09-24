---
id: clean-architecture
title: Clean Architecture and Hexagonal Design
description: Clean Architecture, hexagonal (ports and adapters) design and the dependency rule explained with a Spring Boot layout, trade-offs, and an architecture review checklist.
summary: Clean Architecture organises code so business rules sit at the centre and depend on nothing external. Frameworks, databases and UIs are details at the edge that depend inward through interfaces (ports), so the core can be tested and changed independently.
category: architecture
technology: [Java, Spring Boot, C#, TypeScript]
concepts: [dependency rule, entities, use cases, ports and adapters, hexagonal architecture, layered architecture, domain model, boundaries]
difficulty: advanced
tags: [architecture, clean-architecture, hexagonal, design, ddd]
vibe:
  understand: Source-code dependencies point inward. The domain and use cases never import Spring, JPA, HTTP or Redis classes.
  learn: Learn the dependency rule, ports (interfaces owned by the core) and adapters (implementations at the edge), and how this maps onto packages or modules.
  review: Check whether agent changes put framework annotations or persistence entities into the domain, or let controllers call repositories directly.
  apply: Keep domain logic in plain classes, define repository/gateway interfaces in the core, and implement them in infrastructure adapters.
  prompt: Ask the agent to show the import graph of new classes and flag any inward-to-outward dependency.
review_checklist:
  - Domain/use-case packages do not import framework, persistence or web classes
  - Controllers call use cases/services, not repositories directly (unless the project deliberately uses thin CRUD)
  - Ports (interfaces) are owned by the core; adapters implement them in infrastructure
  - DTOs at the web edge and persistence entities are mapped to/from domain objects
  - New code follows the project's existing layering instead of inventing a new one
  - Architecture rules are enforced by tests (ArchUnit, import-linter) where the project has them
related: [solid-principles, spring-dependency-injection, testing-strategy, code-review]
prompts: [architecture-review-prompt, feature-implementation-prompt]
sources:
  - title: Robert C. Martin — The Clean Architecture (2012)
    url: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
  - title: Alistair Cockburn — Hexagonal Architecture
    url: https://alistair.cockburn.us/hexagonal-architecture/
  - title: ArchUnit — Unit test your Java architecture
    url: https://www.archunit.org/
updated: 2026-09-24
---

## What is Clean Architecture?

Clean Architecture draws concentric circles: **entities** (enterprise rules) → **use cases** (application rules) → **interface adapters** (controllers, presenters, gateways) → **frameworks and drivers** (web, database, UI). Its one essential rule is the **dependency rule**: *source-code dependencies only point inward*.

**Hexagonal architecture** (ports and adapters) expresses the same idea. The application core exposes **ports** (interfaces), and **adapters** connect those ports to HTTP, databases, message brokers and other outside systems.

## Why It is Used

- Business rules can be unit-tested without Spring, a database or the network.
- Infrastructure can be replaced (PostgreSQL to another store, REST to messaging) with limited changes.
- Boundaries are clear for large teams, and for coding agents that need to know where code belongs.

## How It Maps to a Spring Boot Service

```text
com.acme.orders
├── domain/            Order, OrderLine, Money, domain exceptions      (no Spring imports)
├── application/       PlaceOrderUseCase, ports: OrderRepository, PaymentGateway
├── adapters/in/web/   OrderController, request/response DTOs
└── adapters/out/      JpaOrderRepository (implements OrderRepository), StripePaymentGateway
```

```java
// application layer — owns the port
public interface OrderRepository { Optional<Order> find(OrderId id); void save(Order order); }

// adapters/out — depends inward on the port
@Repository
class JpaOrderRepository implements OrderRepository { /* maps OrderEntity <-> Order */ }
```

## Common Mistakes

- **JPA entities as the domain model** with annotations everywhere. This is acceptable for simple CRUD, but then don't claim Clean Architecture.
- **Anaemic use cases** that just forward to repositories, adding layers without isolation.
- **Leaking adapters inward**, for example a use case that accepts an `HttpServletRequest` or returns a `ResponseEntity`.
- **Agents inventing a new structure.** A coding agent may create `service/impl/` in a codebase organised by feature. Consistency beats theoretical purity.

## Trade-offs

Clean Architecture adds mapping code and indirection. For small CRUD services, a well-organised layered design (controller → service → repository) is often the better choice. Use full ports and adapters where domain logic is rich or infrastructure is likely to change.

## Testing

Use cases get fast unit tests with in-memory fakes of the ports. Adapters get integration tests against real infrastructure. Enforce the rules with ArchUnit, for example `noClasses().that().resideInAPackage("..domain..").should().dependOnClassesThat().resideInAPackage("org.springframework..")`.
