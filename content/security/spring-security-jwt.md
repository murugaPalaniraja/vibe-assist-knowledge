---
id: spring-security-jwt
title: Spring Security JWT Authentication
description: How JWT authentication works in Spring Security, the filter chain, common mistakes, and a checklist for reviewing JWT code written by an AI coding agent.
summary: JWT authentication lets a Spring Boot API authenticate each request from a signed token instead of a server-side session. Spring Security validates the token in the filter chain, turns its claims into an Authentication, and then applies authorization rules.
category: security
technology: [Java, Spring Boot, Spring Security]
concepts: [JWT, authentication, authorization, SecurityFilterChain, token validation, OAuth2 resource server, stateless sessions]
difficulty: intermediate
tags: [java, spring, security, jwt, authentication, api]
vibe:
  understand: A JWT is a signed, self-contained claim set. The server trusts it only after verifying the signature, expiry, issuer and audience.
  learn: Learn how SecurityFilterChain, the BearerTokenAuthenticationFilter and JwtDecoder cooperate, and how claims become GrantedAuthority objects.
  review: Check that the agent validates signature, exp, iss and aud, never accepts alg "none", keeps secrets out of source, and actually protects every endpoint it meant to.
  apply: Prefer Spring's built-in OAuth2 resource-server support over a hand-written JwtAuthenticationFilter unless you have a concrete reason.
  prompt: Ask the agent to prove each validation step with a failing test (expired token, wrong issuer, tampered signature, missing role).
review_checklist:
  - item: Token signature is verified with a key the attacker cannot choose
    why: Reject alg "none" and do not trust the alg/kid header blindly; pin the expected algorithm.
  - item: Expiry (exp) and not-before (nbf) are enforced, with a small clock skew
  - item: Issuer (iss) and audience (aud) are validated
    why: Without aud checks, a token minted for another service is accepted.
  - item: Signing secret or private key is not hard-coded and not committed
  - item: HMAC secrets are at least 256 bits; RSA/EC keys are rotated via JWKS where possible
  - item: Session creation policy is STATELESS and CSRF handling is a deliberate decision
  - item: Every endpoint is covered by an explicit authorization rule; the default is deny
    why: Look for permitAll() on broad patterns such as /api/** or /**.
  - item: Roles/authorities are mapped from the right claim with the right prefix (ROLE_)
  - item: 401 vs 403 responses are correct and do not leak why validation failed
  - item: Tokens and secrets are never logged
  - item: Refresh-token and logout/revocation behaviour is defined (or explicitly out of scope)
  - item: Tests cover valid, expired, tampered, wrong-issuer, missing-token and insufficient-role cases
related: [spring-boot-rest-api, spring-boot-exception-handling, spring-boot-testing, spring-dependency-injection, redis-caching]
prompts: [spring-security-review-prompt, agent-change-review-prompt, test-generation-prompt]
sources:
  - title: Spring Security Reference — OAuth 2.0 Resource Server JWT
    url: https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html
  - title: RFC 7519 — JSON Web Token (JWT)
    url: https://www.rfc-editor.org/rfc/rfc7519
  - title: RFC 8725 — JSON Web Token Best Current Practices
    url: https://www.rfc-editor.org/rfc/rfc8725
  - title: OWASP JSON Web Token Cheat Sheet for Java
    url: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
updated: 2026-09-24
---

## What is JWT Authentication?

A **JSON Web Token (JWT)** is a compact string with three Base64URL-encoded parts: `header.payload.signature`. The payload holds **claims** such as `sub` (subject), `exp` (expiry), `iss` (issuer), `aud` (audience) and custom claims like `roles` or `scope`.

**JWT authentication** means the client sends the token on every request, usually in the `Authorization: Bearer <token>` header. The server authenticates the request by *verifying* the token, without looking up a session.

The token is **signed, not encrypted**. Anyone holding it can read the claims, so never put secrets or sensitive personal data in the payload.

## Why JWT Authentication is Used

- **Stateless APIs.** No server-side session store, so any instance behind a load balancer can authenticate a request.
- **Delegated identity.** An identity provider (Keycloak, Auth0, Entra ID, Cognito) issues tokens and your API only validates them.
- **Service-to-service calls.** Downstream services can check who the caller is and what scopes it holds.

The trade-off is **revocation**. A signed token stays valid until it expires unless you add a deny-list or keep token lifetimes short.

## How JWT Authentication Works

1. The client authenticates with an identity provider or a login endpoint and receives an access token (plus, often, a refresh token).
2. The client calls the API with `Authorization: Bearer <access-token>`.
3. The API verifies the signature with the issuer's key (HMAC shared secret, or an RSA/EC public key usually fetched from a JWKS endpoint).
4. The API validates the claims: `exp`, `nbf`, `iss`, `aud` and any required custom claims.
5. The claims are converted into an authenticated principal with authorities.
6. Authorization rules decide whether this principal may call this endpoint.

## Spring Security Flow

In Spring Security 6+, a request passes through the **`SecurityFilterChain`**:

- `BearerTokenAuthenticationFilter` extracts the bearer token.
- `JwtAuthenticationProvider` delegates to a **`JwtDecoder`** (for example `NimbusJwtDecoder`), which verifies the signature and runs the configured `OAuth2TokenValidator`s.
- A **`JwtAuthenticationConverter`** maps claims to `GrantedAuthority` objects. By default it maps `scope`/`scp` to `SCOPE_*` authorities.
- The resulting `JwtAuthenticationToken` is stored in the `SecurityContext`.
- `AuthorizationFilter` evaluates the `authorizeHttpRequests` rules and any method-level `@PreAuthorize` annotations.

Failures produce **401 Unauthorized** (missing or invalid token) through the `AuthenticationEntryPoint`, or **403 Forbidden** (valid token, insufficient rights) through the `AccessDeniedHandler`.

## Important Components

| Component | Responsibility |
|---|---|
| `SecurityFilterChain` bean | Declares which paths need which authorities, session policy, CSRF, and enables the resource server |
| `JwtDecoder` | Verifies signature and validates claims |
| `OAuth2TokenValidator<Jwt>` | Custom claim checks such as audience |
| `JwtAuthenticationConverter` | Claims → authorities mapping |
| `AuthenticationEntryPoint` / `AccessDeniedHandler` | Shape of 401 / 403 responses |

## Implementation Concepts

**Built-in resource server (recommended).** Add `spring-boot-starter-oauth2-resource-server`, set `spring.security.oauth2.resourceserver.jwt.issuer-uri`, and Spring discovers the JWKS keys and validates `iss` for you. Add an audience validator yourself.

**Custom `JwtAuthenticationFilter` (common in agent output).** Coding agents often generate a `OncePerRequestFilter` that parses the token with a JWT library and sets the `SecurityContext` manually. This works, but every validation step becomes your responsibility, and it is easy to forget one. Treat a hand-written filter as a review hot spot.

**Self-issued tokens.** If the same service issues tokens (a `/login` endpoint), keep the signing key in a secret manager or environment variable, use short access-token lifetimes (5–15 minutes) and put a rotation plan in place.

## Common Mistakes

- **Parsing without verifying.** Decoding the payload (for example with `Jwts.parser().unsecured()` or by Base64-decoding it by hand) and trusting the claims.
- **Accepting `alg: none` or algorithm confusion.** Letting the token header decide the algorithm, which can make a public key usable as an HMAC secret.
- **No audience check.** Tokens issued for other APIs by the same identity provider are accepted.
- **Hard-coded secrets** such as `secret = "mySecretKey"` in `application.yml` or in the code, often too short for HS256.
- **`permitAll()` on broad patterns.** For example `requestMatchers("/api/**").permitAll()` added "temporarily" during debugging.
- **Catching `JwtException` and continuing the chain unauthenticated** without clearing the context. The request then relies on later rules to reject it.
- **Role prefix mismatch.** `hasRole("ADMIN")` expects `ROLE_ADMIN`, but the converter produces `SCOPE_admin` or `ADMIN`.
- **Logging the full token** at INFO or DEBUG level.

## Security Considerations

- Keep access tokens short-lived. Use refresh tokens with rotation, and store refresh tokens server-side if you need revocation.
- For browser clients, decide deliberately between an HttpOnly cookie (then **enable CSRF protection**) and a bearer header (then consider the XSS exposure of storage).
- Validate the `typ`/`alg` you expect and reject everything else.
- Rate-limit authentication endpoints and do not reveal whether a username exists.

## Performance Considerations

Signature verification is cheap, but fetching JWKS keys is not. `NimbusJwtDecoder` caches the key set, so make sure a custom decoder does too. Avoid a database lookup on every request unless revocation requires it; if it does, cache the deny-list, for example in [Redis](/redis-caching) with a TTL equal to the token's remaining lifetime.

## Testing

- Use `spring-security-test`: `mockMvc.perform(get("/api/orders").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))`.
- Write **negative tests**: no token → 401, expired token → 401, wrong issuer → 401, valid token without role → 403.
- For a custom filter, test the filter directly with tampered and expired tokens signed by a test key.
- Include one integration test that goes through the real filter chain, not only `@WithMockUser`. That annotation bypasses JWT validation entirely.

## Debugging

- Set `logging.level.org.springframework.security=DEBUG` locally to see which filter rejected the request. Never enable this in production logs that capture headers.
- Decode a token at a local tool or with `jq` to inspect the claims, then compare `iss`/`aud` byte-for-byte with the configuration (trailing slashes are a classic mismatch).
- 401 with a valid-looking token usually means key, issuer or clock skew. 403 usually means the authority mapping.

## Code Example

```java
@Configuration
@EnableMethodSecurity
class SecurityConfig {

  @Bean
  SecurityFilterChain api(HttpSecurity http) throws Exception {
    http
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/actuator/health").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/products/**").hasAuthority("SCOPE_products:read")
        .requestMatchers("/api/admin/**").hasRole("ADMIN")
        .anyRequest().authenticated())                 // default: deny anonymous
      .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .csrf(csrf -> csrf.disable())                    // OK only for pure bearer-token APIs
      .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
    return http.build();
  }

  @Bean
  JwtDecoder jwtDecoder(@Value("${app.jwt.issuer}") String issuer,
                        @Value("${app.jwt.audience}") String audience) {
    NimbusJwtDecoder decoder = JwtDecoders.fromIssuerLocation(issuer);
    OAuth2TokenValidator<Jwt> withAudience = jwt ->
        jwt.getAudience().contains(audience)
            ? OAuth2TokenValidatorResult.success()
            : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "wrong audience", null));
    decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
        JwtValidators.createDefaultWithIssuer(issuer), withAudience));
    return decoder;
  }
}
```

## When to Use It

- Stateless REST APIs consumed by SPAs, mobile apps or other services.
- When an external identity provider already issues tokens.
- Microservices that need to propagate the caller's identity.

## When Not to Use It

- Classic server-rendered web apps, where a session cookie is simpler and supports instant logout.
- When you need immediate revocation of every credential and cannot keep token lifetimes short.
- As a way to store session state. Keep tokens small.
