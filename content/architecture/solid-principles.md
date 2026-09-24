---
id: solid-principles
title: SOLID Principles in Practice
description: The five SOLID object-oriented design principles explained with practical examples, how they apply to agent-generated code, and a design review checklist.
summary: SOLID is a set of five design principles (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion) that keep code easier to change. Use them as review heuristics, not as rules that justify extra abstraction.
category: architecture
technology: [Java, Python, C#, TypeScript]
concepts: [single responsibility, open/closed, Liskov substitution, interface segregation, dependency inversion, cohesion, coupling]
difficulty: intermediate
tags: [design, architecture, oop, solid, clean-code]
vibe:
  understand: Each SOLID principle is about limiting the blast radius of change. A change in one concern should not force changes in unrelated code.
  learn: Learn each principle with a concrete smell it prevents (god classes, switch-on-type, broken subclasses, fat interfaces, hard-wired dependencies).
  review: Watch for both extremes in agent code, from 800-line services to interfaces with exactly one implementation "for SOLID".
  apply: Split classes by reason to change, inject dependencies through constructors, and add abstractions only when a second variation or a test seam needs them.
  prompt: Ask the agent to name each new class's single responsibility in one sentence and justify each new interface.
review_checklist:
  - Each new class has one clear reason to change (can be described in one sentence without "and")
  - New behaviour variants are added without editing large switch/if-else chains on type
  - Subclasses honour the base contract (no throwing UnsupportedOperationException for inherited methods)
  - Interfaces are small and client-specific
  - High-level policy depends on abstractions; infrastructure (DB, HTTP) is injected
  - No speculative interfaces or factories with a single implementation and no test need
related: [clean-architecture, spring-dependency-injection, python-mro, code-review]
prompts: [architecture-review-prompt, safe-refactoring-prompt]
sources:
  - title: Robert C. Martin — The Principles of OOD
    url: http://butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod
  - title: Wikipedia — SOLID
    url: https://en.wikipedia.org/wiki/SOLID
updated: 2026-09-24
---

## What is SOLID?

SOLID is a set of five object-oriented design principles popularised by Robert C. Martin:

| Principle | One-line meaning | Smell it prevents |
|---|---|---|
| **S**ingle Responsibility | A module should have one reason to change | God classes, "Manager"/"Util" dumping grounds |
| **O**pen/Closed | Extend behaviour without modifying stable code | Growing `switch (type)` blocks |
| **L**iskov Substitution | Subtypes must be usable wherever the base type is | Subclasses that throw or weaken guarantees |
| **I**nterface Segregation | Clients shouldn't depend on methods they don't use | Fat interfaces, stub implementations |
| **D**ependency Inversion | Policy depends on abstractions, not on details | Business logic calling `new JdbcTemplate()` or HTTP clients directly |

## How to Apply Each Principle

**Single Responsibility.** An `OrderService` that validates, prices, persists, emails and exports CSV has five reasons to change. Split it by actor or concern, for example `OrderPricing`, `OrderRepository` and `OrderNotifications`.

**Open/Closed.** Replace `if (type == CARD) ... else if (type == PAYPAL)` with a `PaymentMethod` strategy chosen from a map, so a new method is a new class.

```java
interface PaymentMethod { String type(); Receipt pay(Money amount); }

@Service
class Checkout {
  private final Map<String, PaymentMethod> methods;
  Checkout(List<PaymentMethod> all) {
    this.methods = all.stream().collect(toMap(PaymentMethod::type, m -> m));
  }
  Receipt pay(String type, Money amount) { return methods.get(type).pay(amount); }
}
```

**Liskov Substitution.** If `ReadOnlyList extends List` throws on `add`, callers of `List` break. Model capabilities with separate interfaces instead.

**Interface Segregation.** Split `Repository` with 25 methods into focused ports, such as `OrderReader` and `OrderWriter`.

**Dependency Inversion.** Domain code depends on an `OrderRepository` interface. The JPA implementation lives in the infrastructure layer (see [Clean Architecture](/clean-architecture)).

## Common Mistakes (Including Agent Over-Engineering)

- **Interfaces for everything:** `IUserService` with one `UserServiceImpl` and no test or variation need.
- **Splitting too finely:** ten classes of three lines each make a simple flow hard to follow.
- **Using "SOLID" to justify deep inheritance.** Composition usually serves the principles better.
- **Ignoring SRP in generated code:** agents often append new behaviour to the nearest existing class.

## Testing

Good SOLID structure shows up in tests. If a unit test needs ten mocks, the class probably has too many responsibilities. If you can't test the logic without a database, dependencies aren't inverted.

## When Not to Apply Strictly

Scripts, prototypes and small CRUD modules gain little from heavy abstraction. Apply the principles where change is frequent or costly.
