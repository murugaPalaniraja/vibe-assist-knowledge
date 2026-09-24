---
id: ci-cd-pipelines
title: CI/CD Pipelines with GitHub Actions
description: "CI/CD with GitHub Actions: pipeline stages, caching, secrets and token permissions, plus a checklist for reviewing agent-written workflows."
summary: CI/CD automates building, testing and deploying every change. Continuous integration proves a change is safe to merge, and continuous delivery makes releasing it a repeatable, low-risk step. GitHub Actions defines pipelines as YAML workflows in the repository.
category: devops
technology: [GitHub Actions, Git, Docker]
concepts: [continuous integration, continuous delivery, workflow, job, step, runner, secrets, GITHUB_TOKEN permissions, caching, environments, artifact]
difficulty: beginner
tags: [ci-cd, github-actions, devops, automation]
vibe:
  understand: A pipeline is an automated checklist that runs on every push. Build, test, scan, then deploy only if everything passed.
  learn: Learn workflow triggers, jobs vs steps, runners, caching, secrets and environments, and least-privilege permissions for GITHUB_TOKEN.
  review: Check trigger scope, token permissions, secret exposure (especially on pull_request_target), unpinned third-party actions, and whether tests can actually fail the build.
  apply: Keep CI fast with caching and parallel jobs, pin actions, set permissions explicitly, and gate deploys behind environments.
  prompt: Ask the agent to list each workflow's triggers, permissions, secrets used and which third-party actions it trusts.
review_checklist:
  - permissions are set explicitly with least privilege (default read-only)
  - Third-party actions are pinned to a full commit SHA (or at least a major version from a trusted publisher)
  - Secrets are not echoed, not passed to untrusted code, and not exposed to fork PRs
  - pull_request_target and workflow_run are not used to check out and run untrusted PR code
  - Tests, lint and build failures fail the job (no "|| true" or continue-on-error on critical steps)
  - Dependency caches are keyed on lock files
  - Deploy jobs depend on test jobs and use protected environments
  - Concurrency groups prevent overlapping deployments
  - Artifacts/images are built once and promoted, not rebuilt per environment
related: [docker-containers, kubernetes-basics, testing-strategy, code-review]
prompts: [dockerfile-ci-review-prompt, agent-change-review-prompt]
sources:
  - title: GitHub Docs — GitHub Actions
    url: https://docs.github.com/en/actions
  - title: GitHub Docs — Security hardening for GitHub Actions
    url: https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions
  - title: Martin Fowler — Continuous Integration
    url: https://martinfowler.com/articles/continuousIntegration.html
updated: 2026-09-24
---

## What is CI/CD?

- **Continuous Integration (CI):** every change is merged frequently and verified automatically by build, tests, linting and security scans.
- **Continuous Delivery:** every change that passes CI *can* be released at any time, usually with a manual approval.
- **Continuous Deployment:** every passing change is released automatically.

## How GitHub Actions Works

- A **workflow** (`.github/workflows/*.yml`) runs on **events** (`push`, `pull_request`, `schedule`, `workflow_dispatch`).
- A workflow has **jobs**, which run in parallel by default on **runners**. A job has sequential **steps** that run shell commands or reusable **actions**.
- `needs:` orders jobs, and `environment:` adds protection rules and environment-scoped secrets.
- Each job gets a `GITHUB_TOKEN` whose rights are set by `permissions:`.

## Code Example

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
permissions:
  contents: read            # least privilege by default
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '21', cache: maven }
      - run: ./mvnw -B verify          # fails the job on any test failure
  image:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t ghcr.io/${{ github.repository }}:${{ github.sha }} .
```

## Common Mistakes

- **No `permissions:` block.** Depending on repository settings, the token may have write access to everything.
- **`pull_request_target` + checkout of the PR head.** This runs attacker code with secrets available, a well-known supply-chain attack.
- **Echoing secrets** or passing them in URLs. Masking is not a guarantee.
- **`continue-on-error: true` on tests** "to make CI green".
- **Unpinned third-party actions** (`some-org/action@main`) that can change underneath you.
- **Rebuilding images per environment**, so what you tested is not what you deploy.
- **Slow pipelines** (20+ minutes) with no caching, which pushes developers to skip them.

## Security Considerations

Treat CI as production infrastructure: it holds deploy credentials. Prefer OIDC federation to cloud providers over long-lived keys, restrict who can modify workflows (CODEOWNERS), and review agent-generated workflow changes as carefully as application code.

## Debugging

Re-run failed jobs with debug logging (`ACTIONS_STEP_DEBUG=true`). Reproduce locally with the same container image. Check whether cache restore keys are stale when builds behave differently in CI than locally.

## When to Use It

Always, for any shared repository. Even a static site benefits from build, link-check and deploy automation. This knowledge site deploys itself with a GitHub Actions workflow.
