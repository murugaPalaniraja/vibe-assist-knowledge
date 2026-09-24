---
id: spring-security-review-prompt
title: Spring Security Implementation Review Prompt
category: security-review
technology: [Java, Spring Boot, Spring Security]
purpose: Make a coding agent review its own Spring Security change (JWT, filters, authorization rules) for correctness, security and test coverage, and prove each claim with code references or tests.
inputs: [project_context, agent_summary, changed_files, requirements, security_config]
checks:
  - Authentication — how the token or credential is obtained and verified
  - Token validation — signature, algorithm, exp/nbf, issuer, audience
  - Authorization — every endpoint has an explicit rule and the default is deny
  - Secret handling — no hard-coded keys, adequate key length, rotation story
  - Error handling — correct 401 vs 403, no leaking of validation details
  - Session and CSRF policy — deliberate and consistent with the client type
  - Logging — tokens and secrets are never logged
  - Tests — negative cases exist and go through the real filter chain
output_format:
  - Summary of the security design in five sentences or fewer
  - Findings table with severity, file:line and classification (Confirmed / Potential risk / Needs verification)
  - Missing tests, written as test method names
  - Concrete patch suggestions for Confirmed findings only
template: |
  You are reviewing a Spring Security change in {{project_context}}.

  Here is what the previous coding agent reported it did:
  {{agent_summary}}

  Requirements it was meant to satisfy:
  {{requirements}}

  Review ONLY these files, and read them fully before answering:
  {{changed_files}}

  Check, and cite file:line for every statement:
  1. Token verification: which JwtDecoder / library is used, which algorithm is pinned, and whether "none" or header-chosen algorithms are rejected.
  2. Claim validation: exp, nbf, iss and aud. Point to the code that enforces each one, or state that it is missing.
  3. Authorization: list every endpoint and the rule that protects it. Flag any permitAll() on a broad pattern and confirm anyRequest() is authenticated or denied.
  4. Secrets: where the signing key comes from, its length, and whether it could be committed.
  5. Error responses: which paths return 401 vs 403, and whether bodies reveal validation details.
  6. Session/CSRF: is the policy deliberate for this client type?
  7. Logging: search for any log statement that could print a token, header or secret.
  8. Tests: list which of these exist, going through the real filter chain — no token, expired, tampered signature, wrong issuer, wrong audience, missing role.

  Rules:
  - Classify every finding as Confirmed (visible in the code), Potential risk, or Needs verification.
  - Do not claim a vulnerability without pointing at code that shows it.
  - Do not change code yet. Propose patches only for Confirmed findings.

  Output: design summary, findings table (severity | file:line | classification | explanation), missing tests as method names, then patches.
related: [spring-security-jwt, spring-boot-testing, agent-change-review-prompt]
tags: [spring, security, jwt, review]
updated: 2026-09-24
---

## When to Use This Prompt

Use it right after a coding agent reports something like "implemented JWT authentication", "added a JwtAuthenticationFilter", or "updated SecurityConfig". It works best in a fresh agent session, so the reviewer does not inherit the implementer's assumptions.

## Tips

- Paste the actual `SecurityConfig` and filter classes into `{{security_config}}` if the agent cannot read the repository.
- If the agent reports "all checks pass", ask it to show the failing-then-passing test for the expired-token case.
- Pair this with the [Spring Security JWT checklist](/spring-security-jwt#review-checklist) for your own manual pass.
