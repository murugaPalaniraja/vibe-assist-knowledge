---
id: java-multithreading
title: Java Multithreading and Concurrency Essentials
description: Java threads, executors, virtual threads, synchronization, visibility and race conditions explained, plus a checklist for reviewing agent-written concurrent code.
summary: Java concurrency runs work on multiple threads that share memory. Correctness depends on controlling shared mutable state with synchronization, atomic types, immutable data, or confinement, and on managing thread lifecycles through executors.
category: programming
technology: [Java]
concepts: [threads, ExecutorService, virtual threads, race condition, visibility, happens-before, synchronized, volatile, atomic, deadlock, CompletableFuture]
difficulty: advanced
tags: [java, concurrency, threads, multithreading, performance]
vibe:
  understand: Two threads touching the same mutable data without a happens-before relationship is a data race. The result can be lost updates, stale reads or corrupted state.
  learn: Learn ExecutorService, CompletableFuture, virtual threads (Java 21), the java.util.concurrent collections, and the Java Memory Model basics.
  review: Look for shared mutable fields, unbounded thread pools, blocking calls inside synchronized blocks, swallowed InterruptedException and missing shutdown.
  apply: Prefer immutable data and message passing, use executors instead of raw Thread, and use virtual threads for blocking I/O-bound work.
  prompt: Ask the agent to list every piece of state shared between threads and name the mechanism that makes each access safe.
review_checklist:
  - item: Every field accessed from multiple threads is final/immutable, volatile, atomic, or guarded by one lock
  - item: No new Thread() in application code; work goes through a managed executor
  - item: Thread pools are bounded and have a rejection policy; queues are not unbounded by accident
  - item: Executors are shut down on application stop
  - item: InterruptedException is not swallowed (restore the flag with Thread.currentThread().interrupt())
  - item: Locks are always acquired in the same order and released in finally
  - item: No blocking I/O while holding a lock (and no synchronized pinning around I/O on virtual threads before Java 24)
  - item: CompletableFuture chains handle exceptions (exceptionally/handle) and specify an executor for blocking stages
  - item: ThreadLocal values are cleared, especially with pooled threads
  - item: Concurrency is tested (stress tests, timeouts) rather than assumed
related: [java-hashmap, java-exception-handling, python-async-multiprocessing, connection-pooling]
prompts: [concurrency-review-prompt, performance-review-prompt]
sources:
  - title: Java SE 21 API — java.util.concurrent package
    url: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html
  - title: JEP 444 — Virtual Threads
    url: https://openjdk.org/jeps/444
  - title: The Java Tutorials — Concurrency
    url: https://docs.oracle.com/javase/tutorial/essential/concurrency/
updated: 2026-09-24
---

## What is Multithreading?

A Java process can run many **threads** at once, and all of them share the same heap. This allows parallel CPU work and overlapping I/O. It also means any object reachable from two threads can be read or written concurrently.

## Why It Is Used

- Handling many concurrent requests. Servlet containers use a thread per request, and Java 21 adds cheap virtual threads for this.
- Running independent I/O calls in parallel, such as calling three downstream services at once.
- CPU-bound parallelism: parallel streams and `ForkJoinPool`.

## How Java Concurrency Works

- **Executors** decouple tasks from threads: `Executors.newFixedThreadPool(n)`, or `Executors.newVirtualThreadPerTaskExecutor()` on Java 21+.
- **Futures** represent pending results. `CompletableFuture` composes asynchronous steps.
- The **Java Memory Model** defines *happens-before*. The main rules: unlocking a monitor happens-before a later lock of it, a write to a `volatile` field happens-before later reads of it, and `Thread.start()` and `join()` create edges. Without such an edge, another thread may never see a write.

## Important Tools

| Problem | Tool |
|---|---|
| Counter or flag updated by many threads | `AtomicLong`, `LongAdder`, `AtomicBoolean` |
| Shared map | `ConcurrentHashMap` with `compute`/`merge` |
| Mutual exclusion | `synchronized`, `ReentrantLock` |
| Visibility of a single reference | `volatile` |
| Producer/consumer | `BlockingQueue` |
| Limit concurrency | `Semaphore` or a bounded executor |
| Many blocking I/O tasks | Virtual threads |

## Common Mistakes

- **`count++` on a shared field.** This is a read-modify-write race and loses updates.
- **Check-then-act** without atomicity, for example lazy initialisation without synchronization.
- **`Executors.newCachedThreadPool()`** for unbounded workloads, which can create thousands of threads under load.
- **Swallowing `InterruptedException`**, which breaks cancellation and graceful shutdown.
- **Deadlock** from acquiring two locks in different orders in different code paths.
- **`parallelStream()` with blocking I/O**, which starves the shared common pool.
- **Assuming `@Async` or a thread pool propagates** `SecurityContext`, MDC log context or transactions. It does not, unless configured.

## Performance Considerations

More threads is not more throughput. CPU-bound pools should be about the number of cores. For I/O-bound work, prefer virtual threads to huge platform-thread pools, but remember that downstream limits (for example the [database connection pool](/connection-pooling)) cap the useful concurrency anyway.

## Testing and Debugging

- Take a thread dump (`jcmd <pid> Thread.print`) to find deadlocks and blocked threads.
- Use `CountDownLatch` in tests to force interleavings, and put timeouts on every concurrent test.
- Use stress tests or jcstress for lock-free code. Flaky tests are often real races.

## Code Example

```java
try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
  Future<Customer> customer = executor.submit(() -> customerClient.get(id));
  Future<List<Order>> orders = executor.submit(() -> orderClient.list(id));
  return new Dashboard(customer.get(2, SECONDS), orders.get(2, SECONDS));
} // close() waits for tasks and shuts the executor down
```

## When Not to Use Threads

If the work is sequential and fast, threads add complexity for no benefit. If you need durable background jobs, use a job queue instead of in-memory executors, which lose work when the process restarts.
