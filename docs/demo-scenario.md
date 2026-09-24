## The Scenario

A developer asked a coding agent to secure an existing **Spring Boot orders API** and speed up product lookups. The service uses **PostgreSQL**. The agent finished and reported this:

```text
Coding agent summary

Implemented JWT authentication and product caching for orders-api.
- Added spring-boot-starter-security, jjwt 0.12 and spring-boot-starter-data-redis.
- Created JwtAuthenticationFilter (OncePerRequestFilter) that reads the Bearer token,
  parses it with the signing key and sets the SecurityContext.
- Modified SecurityConfig: stateless sessions, CSRF disabled,
  /api/auth/** and /api/products/** are permitAll, everything else authenticated.
- Added AuthController: POST /api/auth/login returns a 24h token signed with HS256.
  Secret is configured in application.yml (app.jwt.secret).
- Enabled Redis caching: @Cacheable("products") on ProductService.getProduct(id),
  @CacheEvict on ProductService.updateProduct.
- Added Flyway migration V7__create_users.sql (users table, unique index on email).
- Added 6 tests. All tests pass.
```

The flow below is what the Vibe-Assist Copilot agent produces from that summary, grounded in Vibe Knowledge pages.

```text
Coding agent summary → Relevant concepts → Vibe Knowledge → Human explanation → Review checklist → Master prompt
```

## 1. What the Coding Agent Did

The agent added **token-based login**. Users call `/api/auth/login` and get a signed JWT valid for 24 hours. Every later request sends that token, and a custom filter checks it before the request reaches a controller. The agent also put a **Redis cache** in front of product reads, so repeated lookups of the same product skip PostgreSQL. It created a `users` table and wrote six tests.

## 2. Why These Changes Were Made

- **JWT + stateless sessions:** so any API instance can authenticate a request without a shared session store.
- **Custom filter:** the agent chose to hand-write validation instead of using Spring's resource-server support.
- **Public `/api/products/**`:** probably so anonymous visitors can browse the catalogue.
- **Redis cache:** product reads are frequent and rarely change.
- **Flyway migration:** login needs stored users with unique emails.

## 3. Files and Components Involved

`SecurityConfig`, `JwtAuthenticationFilter`, `AuthController`, `ProductService`, `application.yml`, `V7__create_users.sql`, `pom.xml` and six test classes or methods. This list comes from the summary only. Confirm it with `git diff --stat`.

## 4. Important Concepts

| Concept | One-line explanation | Vibe Knowledge |
|---|---|---|
| JWT authentication | Signed, self-contained tokens verified on every request | [Spring Security JWT](/spring-security-jwt) |
| Security filter chain & authorization rules | Which paths are public and which need which role | [Spring Security JWT](/spring-security-jwt#review-checklist) |
| Cache-aside with Redis | Read from cache, fall back to the DB, evict on write | [Redis caching](/redis-caching) |
| Transactions & after-commit eviction | Cache changes must follow the DB commit | [Database transactions](/database-transactions) |
| Migrations & indexes | Unique index on email; safe schema changes | [Database indexing](/database-indexing) |
| Meaningful tests | Tests that would fail if the feature broke | [Spring Boot testing](/spring-boot-testing) |

## 5. Potential Risks

| Finding | Classification | Why it matters |
|---|---|---|
| Signing secret stored in `application.yml` | **Confirmed** (stated in the summary) | If the file is committed, anyone with repository access can mint valid tokens. Move it to an environment variable or secret store and rotate it. |
| Access tokens live 24 h with no refresh or revocation mentioned | **Confirmed** (stated) | A stolen token stays valid for a day. Prefer 5–15 min access tokens plus refresh tokens. |
| `/api/products/**` is `permitAll` for **all** HTTP methods | **Potential risk** | If `updateProduct` is exposed as `PUT /api/products/{id}`, anonymous users may be able to modify products. Restrict `permitAll` to `GET`. |
| Custom filter may not validate `exp`, `iss`, `aud` or pin the algorithm | **Needs verification** | Hand-written filters often only check the signature. See the JWT review checklist. |
| Filter behaviour on an invalid token (continue anonymously vs 401) | **Needs verification** | Continuing the chain can combine badly with broad `permitAll` rules. |
| Cache key is only `id` | **Needs verification** | Fine for a single-tenant catalogue. It leaks data if prices or products differ per tenant or customer. |
| No TTL mentioned for the `products` cache | **Needs verification** | Without a TTL, entries live forever and any missed eviction path serves stale data indefinitely. |
| Other write paths (admin, batch import) may not evict the cache | **Potential risk** | Stale product data after updates made outside `updateProduct`. |
| Redis outage behaviour unknown | **Needs verification** | Without timeouts and an error handler, a Redis outage becomes an API outage. |
| "6 tests, all pass" | **Needs verification** | Six tests cannot cover login, filter, authorization, cache and migration failure paths. Check which cases exist. |

None of these is labelled a bug. The summary alone doesn't prove one. The two Confirmed items are design risks the summary states outright.

## 6. What to Inspect

- **SecurityConfig:** method-specific rules for `/api/products/**`, and `anyRequest().authenticated()` present.
- **JwtAuthenticationFilter:** algorithm pinned to HS256; `exp` enforced; issuer and audience checked; a 401 on invalid tokens; tokens never logged.
- **Secret:** loaded from the environment, at least 256 bits, and absent from git history (`git log -p -- src/main/resources/application.yml`).
- **ProductService:** cache TTL configured (`RedisCacheConfiguration.entryTtl`), eviction after commit, JSON serialization, and a `CacheErrorHandler` for Redis failures.
- **Migration:** unique index on `lower(email)`, or case-normalised emails. Check the password hash column type.

Full lists: [JWT checklist](/spring-security-jwt#review-checklist) · [Redis checklist](/redis-caching#review-checklist) · [all checklists](/checklists).

## 7. What to Test

- No token → 401; expired token → 401; tampered signature → 401; token signed with another key → 401.
- `PUT /api/products/1` without a token → 401 (currently this may succeed).
- Valid user token on an admin-only endpoint → 403.
- `getProduct(1)` twice → the repository is called once. After `updateProduct(1)`, the next read hits the repository again.
- With Redis stopped (Testcontainers `stop()`), `GET /api/products/1` still returns 200.
- Registering two users whose emails differ only in case → rejected, if emails should be case-insensitive.

## 8. What to Learn

1. [Spring Security JWT](/spring-security-jwt): how the filter chain validates tokens, and why the built-in resource server is safer than a custom filter.
2. [Redis caching](/redis-caching): cache-aside, TTLs and invalidation.
3. [Database transactions](/database-transactions): why cache eviction belongs after commit.
4. [Spring Boot testing](/spring-boot-testing): testing security through the real filter chain.

## 9. Relevant Vibe Knowledge Links

[Spring Security JWT](/spring-security-jwt) · [Redis caching](/redis-caching) · [Database transactions](/database-transactions) · [Database indexing](/database-indexing) · [Spring Boot testing](/spring-boot-testing) · [Reviewing agent code](/code-review) · [Spring Security review prompt](/spring-security-review-prompt) · [Redis cache review prompt](/redis-cache-review-prompt)

## 10. Master Prompt

This is adapted from the [Coding-Agent Change Review prompt](/agent-change-review-prompt), with the JWT and Redis checks merged in. Paste it into a fresh coding-agent session:

```text
You are a senior reviewer. Another coding agent changed our Spring Boot orders-api (Java 21, PostgreSQL).
Its summary: JWT auth via a custom JwtAuthenticationFilter (jjwt 0.12, HS256, 24h tokens, secret in
application.yml), SecurityConfig with /api/auth/** and /api/products/** permitAll, Redis @Cacheable("products")
on ProductService.getProduct(id) with @CacheEvict on updateProduct, Flyway V7__create_users.sql, 6 tests.

Read SecurityConfig, JwtAuthenticationFilter, AuthController, ProductService, the cache configuration,
application.yml, V7__create_users.sql and all new tests before answering. Cite file:line for every statement.

1. JWT: show where the algorithm is pinned and where exp, iss and aud are validated, or state that they are missing.
   What does the filter do on an invalid token? Are tokens or secrets ever logged?
2. Secret: where is app.jwt.secret loaded from, how long is it, and is it in git history?
3. Authorization: list every endpoint with its HTTP method and rule. Can an anonymous user call any
   non-GET /api/products endpoint?
4. Cache: key format, TTL, serializer, every write path to products and whether it evicts after commit,
   and behaviour when Redis is unreachable.
5. Migration: email uniqueness (case-sensitivity), password column, lock impact on existing tables.
6. Tests: list the 6 tests. Which of these exist: no token, expired, tampered, anonymous PUT on products,
   cache hit, eviction after update, Redis down?

Label every finding Confirmed, Potential risk or Needs verification. Do not call anything a bug without
code evidence. Do not modify code. Output: findings table, missing tests (as method names), and
proposed patches for Confirmed findings only.
```
