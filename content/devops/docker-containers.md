---
id: docker-containers
title: Docker Containers and Dockerfile Best Practices
description: How Docker images and containers work, multi-stage builds, layer caching, non-root users and image security, with a checklist for reviewing agent-written Dockerfiles.
summary: Docker packages an application and its runtime into an image that runs as an isolated container. Good Dockerfiles are small, reproducible, cache-friendly, run as a non-root user and never bake in secrets.
category: devops
technology: [Docker]
concepts: [image, container, layer, multi-stage build, build cache, non-root user, .dockerignore, image scanning, docker compose]
difficulty: beginner
tags: [docker, containers, devops, security]
vibe:
  understand: An image is a read-only stack of filesystem layers plus metadata. A container is a running process with its own isolated view of that filesystem, network and process tree.
  learn: Learn Dockerfile instructions, layer caching, multi-stage builds, .dockerignore, and container security basics.
  review: Check base image pinning, secrets in layers, root user, missing .dockerignore, cache-busting COPY order, and health checks.
  apply: Use multi-stage builds with slim or distroless runtime images, pin versions, copy dependency manifests first, and run as a non-root user.
  prompt: Ask the agent to report final image size, user, exposed ports, and to prove no secret exists in any layer (docker history).
review_checklist:
  - Base images are pinned to a specific version (ideally digest), not latest
  - Multi-stage build; build tools and sources are not in the runtime image
  - No secrets in ENV, ARG, COPY or RUN layers (use build secrets / runtime injection)
  - Container runs as a non-root USER
  - .dockerignore excludes .git, node_modules, target, .env and local artifacts
  - Dependency manifests are copied before source for effective layer caching
  - One process per container; PID 1 handles signals (exec form CMD/ENTRYPOINT)
  - HEALTHCHECK or orchestrator probes defined
  - Image is scanned for vulnerabilities in CI
related: [ci-cd-pipelines, kubernetes-basics, connection-pooling]
prompts: [dockerfile-ci-review-prompt, kubernetes-manifest-review-prompt]
sources:
  - title: Docker Docs — Building best practices
    url: https://docs.docker.com/build/building/best-practices/
  - title: Docker Docs — Multi-stage builds
    url: https://docs.docker.com/build/building/multi-stage/
  - title: Docker Docs — Build secrets
    url: https://docs.docker.com/build/building/secrets/
updated: 2026-09-24
---

## What is Docker?

**Docker** builds **images** from a `Dockerfile` and runs them as **containers**. Linux kernel features (namespaces and cgroups) give each container isolated processes, networking and resource limits while sharing the host kernel. That makes containers much lighter than virtual machines.

## How Images Work

Each instruction (`FROM`, `RUN`, `COPY`) creates a **layer**. Layers are cached and reused when neither the instruction nor its inputs changed. Once a layer changes, every later layer is rebuilt, so put rarely changing steps first.

## Code Example: Multi-Stage Java Build

```dockerfile
# syntax=docker/dockerfile:1
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /src
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN ./mvnw -q dependency:go-offline          # cached unless pom.xml changes
COPY src src
RUN ./mvnw -q package -DskipTests

FROM eclipse-temurin:21-jre-jammy
RUN useradd --system --uid 10001 app
WORKDIR /app
COPY --from=build /src/target/app.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```

## Common Mistakes

- **`FROM node:latest`**: builds are not reproducible and can break silently.
- **`COPY . .` before installing dependencies**, which reinstalls everything on every code change.
- **Secrets in images.** `ENV DB_PASSWORD=...` or `COPY .env` persists in the layer history, even if a later step deletes the file.
- **Running as root.** A container escape or a writable mount then has root on the host's files.
- **Shell-form `CMD java -jar app.jar`.** The shell becomes PID 1 and does not forward `SIGTERM`, so graceful shutdown breaks.
- **No `.dockerignore`.** The build context ships `.git` and local secrets to the daemon.
- **Huge images** from shipping compilers, caches and source code.

## Security Considerations

Use minimal base images (slim, distroless or Chainguard-style), scan with Trivy, Grype or Docker Scout in CI, drop Linux capabilities, prefer read-only root filesystems, and pass secrets at runtime from the orchestrator's secret store. For build-time credentials, use `RUN --mount=type=secret`.

## Performance Considerations

Order layers for cache hits and use BuildKit cache mounts (`--mount=type=cache,target=/root/.m2`). Set JVM or Node memory relative to container limits: `-XX:MaxRAMPercentage` for the JVM, `--max-old-space-size` for Node.

## Testing and Debugging

- `docker history --no-trunc image` shows every layer command, so you can check for leaked secrets.
- `docker run --rm -it --entrypoint sh image` lets you inspect the filesystem (not possible with distroless images; use debug variants).
- Use `docker compose` to run the app with PostgreSQL and Redis locally for integration tests.

## When Not to Use Docker

A static site or a serverless function deployed by a platform may not need a custom image at all. Don't containerise just to follow a trend if the platform already packages the app.
