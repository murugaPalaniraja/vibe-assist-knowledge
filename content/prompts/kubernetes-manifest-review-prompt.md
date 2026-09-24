---
id: kubernetes-manifest-review-prompt
title: Kubernetes Manifest Review Prompt
category: infrastructure-review
technology: [Kubernetes]
purpose: Review Kubernetes manifests or Helm values for reliability (probes, resources, replicas, shutdown), security (securityContext, secrets) and capacity side effects such as database connection totals.
inputs: [project_context, manifests_or_helm_values, app_runtime, dependencies]
checks:
  - Image tags immutable
  - Readiness vs liveness probe design
  - Requests/limits vs runtime memory settings
  - securityContext and secret handling
  - Replicas, PodDisruptionBudget, graceful shutdown
  - Capacity side effects on dependencies
output_format:
  - Per-workload summary
  - Findings with classification
  - Rollout and failure scenario analysis
template: |
  CONTEXT
  {{project_context}}
  Application runtime (JVM, Node, Python, and its memory settings): {{app_runtime}}
  Dependencies (DB max_connections, Redis, external APIs): {{dependencies}}

  MANIFESTS / HELM VALUES
  {{manifests_or_helm_values}}

  1. For each workload: image tag, replicas, requests and limits, probes, securityContext, and where secrets come from.
  2. Probes: does readiness reflect the ability to serve? Does liveness avoid external dependencies? Is a startup probe needed?
  3. Memory: compare the limit with the runtime heap settings plus overhead, and flag OOMKill risk.
  4. Walk through a rolling update: what happens to in-flight requests? Check terminationGracePeriodSeconds, graceful shutdown and preStop hooks.
  5. Walk through a dependency outage (database down): do Pods restart in a loop, or just become unready?
  6. Capacity: replicas × pool size vs database max_connections; HPA max replicas vs dependency limits.

  Label findings Confirmed, Potential risk or Needs verification.
related: [kubernetes-basics, docker-containers, connection-pooling]
tags: [kubernetes, infrastructure, reliability, security]
updated: 2026-09-24
---

## When to Use This Prompt

Use it for any agent-generated `Deployment`, Helm chart or Kustomize overlay, before applying it to a shared cluster.
