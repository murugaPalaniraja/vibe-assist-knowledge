---
id: ref-kubernetes-liveness-readiness-and-startup-probes
title: Kubernetes Liveness, Readiness, and Startup Probes
description: 'Reference note on Kubernetes Liveness, Readiness, and Startup Probes from Kubernetes documentation: topics, key concepts and related review checklists.'
summary: 'Reference note for “Liveness, Readiness, and Startup Probes” from Kubernetes documentation: the topics it covers, its key concepts, and links to related Vibe Knowledge for reviewing agent-written code.'
category: devops
technology:
- Kubernetes
concepts:
- Types of probe
- Startup probe
- Liveness probe
- Readiness probe
- Check mechanisms
- Probe results
- Configuration fields
- Probe-level terminationGracePeriodSeconds
- Probe mechanism details
- HTTP probes
- TCP probes
- gRPC probes
difficulty: intermediate
tags:
- kubernetes
- probes
- reliability
related:
- kubernetes-basics
sources:
- title: Kubernetes documentation — Liveness, Readiness, and Startup Probes
  url: https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/
  license: CC-BY-4.0
origin: ingested
provenance:
  name: Kubernetes documentation
  url: https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/
  retrieved_at: '2026-09-24'
  license: CC-BY-4.0
  source_type: url
  content_hash: sha256:4b1ccdc903d7513d0ed3da2c15f2acd3d64f86b8a1d434e1ad1381abce7387ab
  publish_mode: excerpt
index: false
updated: '2026-09-24'
---

## Overview

> Kubernetes lets you define probes to continuously monitor the health of containers in a Pod. A probe is a diagnostic performed periodically by the kubelet on a container.

— quoted from [Kubernetes documentation](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)

## Topics Covered in the Source

- Types of probe
- Startup probe
- Liveness probe
- Readiness probe
- When to use each probe
- When should you use a startup probe?
- When should you use a liveness probe?
- When should you use a readiness probe?
- Check mechanisms
- Probe results
- Configuration fields
- Probe-level terminationGracePeriodSeconds
- Probe mechanism details
- HTTP probes
- TCP probes

## Key Concepts

- Types of probe
- Startup probe
- Liveness probe
- Readiness probe
- Check mechanisms
- Probe results
- Configuration fields
- Probe-level terminationGracePeriodSeconds
- Probe mechanism details
- HTTP probes
- TCP probes
- gRPC probes

## Read the Original

The complete, authoritative explanation is in [Kubernetes documentation: Liveness, Readiness, and Startup Probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/) (license: CC-BY-4.0). This note only maps the source to Vibe Knowledge; related articles and review checklists are linked below.
