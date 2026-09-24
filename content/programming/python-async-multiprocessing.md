---
id: python-async-multiprocessing
title: Python asyncio vs Threads vs Multiprocessing
description: When to use asyncio, threading or multiprocessing in Python, how the GIL affects each, common async pitfalls, and a checklist for reviewing agent concurrency code.
summary: Python offers three concurrency models. asyncio runs many I/O-bound tasks on one thread with an event loop, threads suit blocking I/O libraries, and multiprocessing gives true CPU parallelism by running separate interpreter processes.
category: programming
technology: [Python]
concepts: [asyncio, event loop, coroutine, await, GIL, threading, multiprocessing, ProcessPoolExecutor, free-threaded Python]
difficulty: intermediate
tags: [python, asyncio, concurrency, multiprocessing, performance]
vibe:
  understand: asyncio is cooperative. A task gives up control only at await, so one blocking call freezes every task on the loop.
  learn: Learn the event loop, async/await, asyncio.gather and TaskGroup, concurrent.futures, and how the GIL limits CPU-bound threads.
  review: Look for blocking calls (requests, time.sleep, sync DB drivers) inside async def, unawaited coroutines, and unbounded gather over thousands of tasks.
  apply: Use asyncio for high-concurrency network I/O, threads for blocking libraries, and processes for CPU-heavy work.
  prompt: Ask the agent to list every blocking call reachable from an async function and how it is offloaded.
review_checklist:
  - No blocking I/O or time.sleep() inside async functions (use async clients or asyncio.to_thread)
  - Every coroutine is awaited or scheduled; no "coroutine was never awaited" warnings
  - Concurrency is bounded (Semaphore, worker pool) instead of gather() over unbounded input
  - Tasks are cancelled/cleaned up on shutdown; TaskGroup or gather error handling is explicit
  - CPU-bound work uses ProcessPoolExecutor, not threads or the event loop
  - Multiprocessing entry points are guarded by if __name__ == "__main__"
  - Objects sent to worker processes are picklable and reasonably small
  - Timeouts exist on network awaits (asyncio.timeout)
related: [python-generators, java-multithreading, connection-pooling]
prompts: [concurrency-review-prompt, performance-review-prompt]
sources:
  - title: Python docs — asyncio
    url: https://docs.python.org/3/library/asyncio.html
  - title: Python docs — multiprocessing
    url: https://docs.python.org/3/library/multiprocessing.html
  - title: Python docs — concurrent.futures
    url: https://docs.python.org/3/library/concurrent.futures.html
updated: 2026-09-24
---

## What are the Three Models?

| Model | Parallel CPU? | Best for | Cost |
|---|---|---|---|
| `asyncio` | No (one thread) | Thousands of concurrent network calls | Needs async-aware libraries |
| `threading` | No for CPU-bound Python code under the GIL | Blocking I/O libraries | Shared-state races |
| `multiprocessing` | Yes | CPU-bound work (parsing, image processing, ML preprocessing) | Process start-up, pickling overhead |

In standard CPython, the **GIL** lets only one thread execute Python bytecode at a time. Python 3.13+ offers an optional free-threaded build, but most deployments still use the default build.

## How asyncio Works

An `async def` function returns a **coroutine**. The **event loop** runs tasks until each hits `await` on something not yet ready, such as a socket read, and then switches to another task. Concurrency comes from overlapping waits, not from parallel execution.

```python
import asyncio, httpx

async def fetch_all(urls: list[str]) -> list[int]:
    limit = asyncio.Semaphore(20)                      # bounded concurrency
    async with httpx.AsyncClient(timeout=10) as client:
        async def one(url):
            async with limit:
                r = await client.get(url)
                return r.status_code
        async with asyncio.TaskGroup() as tg:          # 3.11+: structured concurrency
            tasks = [tg.create_task(one(u)) for u in urls]
    return [t.result() for t in tasks]
```

## Multiprocessing Basics

```python
from concurrent.futures import ProcessPoolExecutor

def score(doc: str) -> float: ...   # CPU-heavy, top-level (picklable)

if __name__ == "__main__":
    with ProcessPoolExecutor() as pool:
        results = list(pool.map(score, docs, chunksize=100))
```

## Common Mistakes

- Calling `requests.get()` or a sync database driver inside `async def`. The whole loop blocks.
- Forgetting `await`, which creates a coroutine that never runs.
- `asyncio.gather(*[call(x) for x in 100_000_items])`, which overwhelms downstream services and sockets.
- Using threads for CPU-bound Python code and expecting a speed-up.
- Missing the `if __name__ == "__main__"` guard. On Windows and macOS, `spawn` re-imports the module in every child.
- Sending huge objects to worker processes. Pickling costs more than the work.

## Debugging

Run with `PYTHONASYNCIODEBUG=1` or `asyncio.run(main(), debug=True)` to log slow callbacks, which reveals blocking calls. Use `py-spy dump` to see what each thread or process is doing.

## When Not to Use Them

If the script is a sequential batch job that finishes in seconds, plain synchronous code is easier to read and debug. Add concurrency only when you've measured an I/O wait or CPU bottleneck.
