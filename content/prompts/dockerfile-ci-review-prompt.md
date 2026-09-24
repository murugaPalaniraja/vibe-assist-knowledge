---
id: dockerfile-ci-review-prompt
title: Dockerfile and CI Pipeline Review Prompt
category: devops-review
technology: [Docker, GitHub Actions]
purpose: Review Dockerfiles and CI workflows written or changed by a coding agent for reproducibility, supply-chain security, secret handling, caching and correct failure behaviour.
inputs: [project_context, dockerfiles, workflow_files, deployment_target]
checks:
  - Pinned base images and actions
  - No secrets in image layers or logs
  - Non-root runtime, minimal image
  - Least-privilege workflow permissions
  - Untrusted PR code never runs with secrets
  - Failures fail the pipeline
  - Build once, promote the same artifact
output_format:
  - Dockerfile findings
  - Workflow findings (trigger | permissions | secrets | third-party actions)
  - Supply-chain risks
  - Suggested fixes
template: |
  CONTEXT
  {{project_context}}
  Deployment target: {{deployment_target}}

  DOCKERFILES
  {{dockerfiles}}

  WORKFLOWS
  {{workflow_files}}

  Dockerfile:
  1. Are base images pinned? Is the build multi-stage? What is the runtime user? What ends up in the final image?
  2. Could any secret be in a layer (ENV, ARG, COPY of .env, RUN with tokens)? Is there a .dockerignore?
  3. Is the layer order cache-friendly? Is CMD or ENTRYPOINT in exec form so signals reach the app?

  Workflows:
  4. For each workflow, list triggers, the permissions block, secrets used, and third-party actions with their pinning.
  5. Flag pull_request_target or workflow_run that check out PR code, echoed secrets, and continue-on-error or "|| true" on tests or builds.
  6. Confirm deploy jobs depend on test jobs, use protected environments, and deploy the artifact that was tested.

  Label findings Confirmed, Potential risk or Needs verification with file:line.
related: [docker-containers, ci-cd-pipelines, kubernetes-basics]
tags: [docker, ci-cd, github-actions, supply-chain]
updated: 2026-09-24
---

## When to Use This Prompt

Use it whenever an agent adds or edits a `Dockerfile`, `docker-compose.yml` or anything under `.github/workflows/`. Treat these as security-relevant changes.
