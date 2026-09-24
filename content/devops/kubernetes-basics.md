---
id: kubernetes-basics
title: Kubernetes Basics for Application Developers
description: "Kubernetes for developers: Pods, Deployments, Services, probes, resource limits and secrets, plus a checklist for agent-written manifests."
summary: Kubernetes runs containers across a cluster and keeps them in the desired state you declare. Developers mainly work with Deployments, Services, configuration objects, health probes and resource requests, and small mistakes in these cause most production incidents.
category: devops
technology: [Kubernetes, Docker]
concepts: [Pod, Deployment, ReplicaSet, Service, Ingress, ConfigMap, Secret, liveness probe, readiness probe, resource requests and limits, rolling update, HPA]
difficulty: intermediate
tags: [kubernetes, k8s, devops, containers, deployment]
vibe:
  understand: You declare the desired state (for example 3 replicas of image v2) and Kubernetes controllers continuously work to make reality match.
  learn: Learn Pods, Deployments, Services, ConfigMaps and Secrets, probes, requests and limits, and rolling updates.
  review: Check probes, resource requests and limits, image tags, securityContext, secret handling, replica count and graceful shutdown.
  apply: Always set readiness probes and resource requests, use immutable image tags, run as non-root, and handle SIGTERM.
  prompt: Ask the agent to explain what happens to in-flight requests during a rolling update and when the database is down.
review_checklist:
  - Image uses an immutable tag or digest (not latest)
  - Readiness probe reflects ability to serve; liveness probe does not depend on external systems
  - CPU/memory requests are set; memory limit is set and matched to runtime settings (JVM/Node heap)
  - securityContext runs as non-root with readOnlyRootFilesystem and no privilege escalation
  - Secrets come from Secret objects or an external secret store, not ConfigMaps or plain env in manifests
  - replicas ≥ 2 (or HPA) plus a PodDisruptionBudget for services that must stay up
  - Graceful shutdown handles SIGTERM within terminationGracePeriodSeconds
  - Total DB connections across replicas fit the database limit
  - Resources have labels and live in the intended namespace
related: [docker-containers, ci-cd-pipelines, connection-pooling]
prompts: [kubernetes-manifest-review-prompt, dockerfile-ci-review-prompt]
sources:
  - title: Kubernetes Documentation — Overview
    url: https://kubernetes.io/docs/concepts/overview/
  - title: Kubernetes Documentation — Liveness, Readiness and Startup Probes
    url: https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/
  - title: Kubernetes Documentation — Resource Management for Pods and Containers
    url: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
updated: 2026-09-24
---

## What is Kubernetes?

**Kubernetes (K8s)** is a container orchestrator. You submit declarative objects (YAML) to the API server. Controllers then schedule containers onto nodes, restart failed ones, roll out new versions and route traffic.

## Core Objects

| Object | Purpose |
|---|---|
| **Pod** | One or more containers sharing a network namespace. The unit of scheduling, and disposable |
| **Deployment** | Manages ReplicaSets, handling the replica count and rolling updates |
| **Service** | A stable virtual IP and DNS name that load-balances to ready Pods |
| **Ingress / Gateway** | HTTP routing from outside the cluster |
| **ConfigMap / Secret** | Configuration and sensitive values, as environment variables or files |
| **HorizontalPodAutoscaler** | Scales replicas on CPU or custom metrics |

## How Probes Work

- **Readiness:** "can I receive traffic?" If it fails, the Pod is removed from Service endpoints but not restarted.
- **Liveness:** "am I stuck?" If it fails, the container is **restarted**.
- **Startup:** holds off the liveness checks while a slow application boots.

A liveness probe that checks the database restarts **every** Pod when the database blips, which turns a partial outage into a total one.

## Code Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: orders-api, labels: { app: orders-api } }
spec:
  replicas: 3
  selector: { matchLabels: { app: orders-api } }
  template:
    metadata: { labels: { app: orders-api } }
    spec:
      terminationGracePeriodSeconds: 30
      containers:
        - name: app
          image: ghcr.io/acme/orders-api:1.8.3
          ports: [{ containerPort: 8080 }]
          envFrom: [{ secretRef: { name: orders-api-secrets } }]
          resources:
            requests: { cpu: 250m, memory: 512Mi }
            limits: { memory: 768Mi }
          readinessProbe: { httpGet: { path: /actuator/health/readiness, port: 8080 }, periodSeconds: 5 }
          livenessProbe: { httpGet: { path: /actuator/health/liveness, port: 8080 }, periodSeconds: 10 }
          securityContext:
            runAsNonRoot: true
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
```

## Common Mistakes

- **No resource requests.** The scheduler over-packs nodes and noisy neighbours starve the application.
- **A memory limit below heap plus overhead.** The container gets OOMKilled with exit code 137.
- **`image: app:latest`** with `imagePullPolicy: IfNotPresent`. Different nodes run different code.
- **Secrets in ConfigMaps**, or committed as base64 in YAML. Base64 is encoding, not encryption.
- **No graceful shutdown.** In-flight requests fail on every deploy. Enable `server.shutdown=graceful` in Spring Boot.
- **Scaling replicas without checking database connections** (see [connection pooling](/connection-pooling)).

## Debugging

- `kubectl describe pod <pod>` shows events: image pull errors, probe failures, OOMKilled.
- `kubectl logs <pod> --previous` gives the logs of the crashed container.
- `kubectl get endpoints <svc>` shows no endpoints when readiness is failing or selectors don't match.
- `kubectl rollout status` / `rollout undo deployment/<name>` checks or reverts a deployment.

## When Not to Use Kubernetes

For a single service, a small team, or a static site, a managed platform (Cloud Run, App Service, ECS, GitHub Pages) is usually cheaper and simpler. Kubernetes pays off with many services and teams.
