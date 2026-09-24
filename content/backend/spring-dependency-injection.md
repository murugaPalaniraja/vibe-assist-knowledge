---
id: spring-dependency-injection
title: Spring Dependency Injection and Bean Lifecycle
description: "How Spring dependency injection works: constructor injection, bean scopes, proxies and circular dependencies, with a review checklist."
summary: Dependency injection means objects receive their collaborators instead of creating them. Spring's IoC container creates beans, resolves their dependencies, wraps them in proxies for features like transactions, and manages their lifecycle.
category: backend
technology: [Java, Spring Boot]
concepts: [inversion of control, dependency injection, ApplicationContext, bean scope, constructor injection, proxies, circular dependency, "@Configuration"]
difficulty: intermediate
tags: [java, spring, dependency-injection, ioc]
vibe:
  understand: Spring builds your object graph. You declare dependencies in constructors and the container supplies them.
  learn: Learn constructor injection, @Component vs @Bean, bean scopes, qualifiers, and how proxies enable @Transactional, @Async and @Cacheable.
  review: Look for field injection, circular dependencies, self-invocation that bypasses proxies, and prototype or request state leaking into singletons.
  apply: Use constructor injection with final fields, depend on interfaces at boundaries, and keep configuration in @Configuration classes.
  prompt: Ask the agent to list the new beans it created, their scope, and every place it relies on a proxy (@Transactional, @Cacheable, @Async).
review_checklist:
  - Constructor injection with final fields (no @Autowired fields in new code)
  - No circular dependencies (spring.main.allow-circular-references stays false)
  - "@Transactional / @Cacheable / @Async methods are public and not called via this.method() from the same class"
  - Singleton beans hold no per-request mutable state
  - Multiple implementations are disambiguated with @Qualifier or @Primary deliberately
  - Configuration values use @ConfigurationProperties with validation, not scattered @Value strings
  - Beans are not created manually with new when they need Spring features
related: [spring-boot-rest-api, spring-boot-testing, redis-caching, database-transactions, solid-principles]
prompts: [architecture-review-prompt, agent-change-review-prompt]
sources:
  - title: Spring Framework Reference — The IoC Container
    url: https://docs.spring.io/spring-framework/reference/core/beans.html
  - title: Spring Framework Reference — Understanding AOP Proxies
    url: https://docs.spring.io/spring-framework/reference/core/aop/proxying.html
updated: 2026-09-24
---

## What is Dependency Injection?

With **Inversion of Control (IoC)**, a container rather than your code decides how objects are created and wired. **Dependency Injection (DI)** is the mechanism: a class declares what it needs, usually as constructor parameters, and the container supplies matching beans.

## How the Spring Container Works

1. **Scan and register.** Classes annotated with `@Component`, `@Service`, `@Repository` or `@Controller`, plus `@Bean` methods in `@Configuration` classes, become bean definitions. Spring Boot auto-configuration adds more.
2. **Instantiate and inject.** Beans are created in dependency order, and constructor arguments are resolved by type, then by qualifier or name.
3. **Post-process.** `BeanPostProcessor`s wrap beans in **proxies** that add transactions, caching, security or async behaviour.
4. **Lifecycle.** `@PostConstruct` and `@PreDestroy` callbacks run. Singleton beans live as long as the context.

## Bean Scopes

| Scope | Instances | Watch out |
|---|---|---|
| `singleton` (default) | One per context | Must be thread-safe and stateless |
| `prototype` | New per injection | Injected once into a singleton, it is effectively a singleton |
| `request` / `session` | Per HTTP request/session | Needs a scoped proxy when injected into singletons |

## The Proxy Trap

`@Transactional`, `@Cacheable` and `@Async` work through proxies. A call from **inside the same class** (`this.save()`) bypasses the proxy, so there is **no transaction and no cache**. This is one of the most common bugs in agent-generated Spring code.

```java
@Service
class OrderService {
  public void importAll(List<Order> orders) {
    orders.forEach(this::save);   // self-invocation: @Transactional below is ignored
  }
  @Transactional
  public void save(Order o) { ... }
}
```

The fix is to move `save` to another bean, or to put `@Transactional` on the outer public method.

## Code Example

```java
@Service
class PaymentService {
  private final PaymentGateway gateway;          // interface
  private final PaymentProperties props;

  PaymentService(PaymentGateway gateway, PaymentProperties props) {   // no @Autowired needed
    this.gateway = gateway;
    this.props = props;
  }
}

@ConfigurationProperties(prefix = "payments")
@Validated
record PaymentProperties(@NotBlank String merchantId, @DurationMin(seconds = 1) Duration timeout) {}
```

## Common Mistakes

- **Field injection** (`@Autowired private Foo foo;`). It hides dependencies, prevents `final`, and makes unit tests need reflection.
- **Circular dependencies** "fixed" with `@Lazy` or by enabling circular references. These usually signal a responsibility problem.
- **Mutable fields in singletons** such as `private User currentUser;`, which is a race across requests.
- **Too many constructor parameters** (seven or more). That usually signals a class doing too much (see [SOLID](/solid-principles)).

## Testing

Constructor injection allows plain unit tests: `new PaymentService(fakeGateway, props)`. Use `@SpringBootTest` sparingly, and slice tests (`@WebMvcTest`, `@DataJpaTest`) for wiring.

## Debugging

- `NoSuchBeanDefinitionException` or `NoUniqueBeanDefinitionException` means scanning or qualifier issues. Check package locations and conditions.
- If a proxy feature "does nothing", check for self-invocation, private or final methods, and objects created with `new`.
- Start with `--debug` for the auto-configuration report.
