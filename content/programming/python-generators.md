---
id: python-generators
title: Python Generators and Lazy Iteration
description: How Python generators and yield work, generator expressions, yield from, memory benefits, one-shot iteration pitfalls, and a review checklist for agent code.
summary: A generator is a function that uses yield to produce values lazily, one at a time, pausing between them. Generators let you stream large or infinite sequences in constant memory, but they can be consumed only once.
category: programming
technology: [Python]
concepts: [generator, yield, iterator protocol, lazy evaluation, generator expression, yield from, itertools]
difficulty: intermediate
tags: [python, generators, iterators, memory]
vibe:
  understand: Calling a generator function returns an iterator. The body runs only when you ask for the next value, and it pauses at each yield.
  learn: Learn the iterator protocol, generator expressions, yield from, and itertools for composing lazy pipelines.
  review: Check whether the agent iterates a generator twice, forces it into a list unnecessarily, or leaves resources open inside a generator.
  apply: Use generators to stream files, paginated APIs and database rows. Materialise with list() only when you need len(), indexing or reuse.
  prompt: Ask the agent where data is materialised in memory and whether any generator is consumed more than once.
review_checklist:
  - Generators are not iterated twice (the second loop silently sees nothing)
  - list(...) is not wrapped around a large generator without need
  - Resources opened inside a generator are closed via with-blocks, even if the consumer stops early
  - Functions that return generators are named/documented so callers know the result is lazy
  - Exceptions raised inside the generator surface at the consumer and are handled there
  - Infinite generators are always bounded by islice/takewhile or a break
related: [python-async-multiprocessing, python-shallow-deep-copy, python-mro]
prompts: [agent-change-review-prompt, concept-learning-prompt]
sources:
  - title: Python HOWTO — Functional Programming (Generators)
    url: https://docs.python.org/3/howto/functional.html
  - title: PEP 255 — Simple Generators
    url: https://peps.python.org/pep-0255/
  - title: Python docs — itertools
    url: https://docs.python.org/3/library/itertools.html
updated: 2026-09-24
---

## What is a Generator?

A **generator function** contains `yield`. Calling it does not run the body. It returns a **generator object** that implements the iterator protocol (`__iter__` and `__next__`). Each `next()` runs the body until the next `yield`, hands out that value, and freezes the function's local state until the next call.

```python
def read_records(path):
    with open(path, encoding="utf-8") as f:
        for line in f:
            if line.strip():
                yield parse(line)
```

## Why Generators are Used

- **Constant memory.** Process a 10 GB file line by line instead of loading it.
- **Pipelines.** Chain lazy steps: read → filter → transform → batch.
- **Infinite or unknown-length sequences** such as event streams and paginated APIs.

## How It Works

- A **generator expression** is `(x * 2 for x in items)`, the lazy counterpart of a list comprehension.
- `yield from sub()` delegates to a sub-generator.
- When the body returns, the generator raises `StopIteration` and `for` loops end cleanly.
- `gen.close()` raises `GeneratorExit` inside the generator, so the `with`/`finally` blocks run.

## Common Mistakes

- **Double iteration.** Computing `total = sum(g)` and then `count = len(list(g))` gives a count of 0, because the generator is already exhausted.
- **Accidental materialisation.** `list(huge_generator)` or `sorted(...)` defeats the purpose.
- **Late errors.** Validation inside a generator runs only on first iteration, which may be far from the call site.
- **Returning a generator from inside a `with` block** that closes the resource before the caller iterates.
- **Expecting truthiness.** A generator object is always truthy, even when it will yield nothing.

## Performance Considerations

Generators trade a little per-item overhead for a large memory saving. For small collections that are reused, a list is simpler and faster. `itertools` functions (`islice`, `chain`, `groupby`, `batched` in 3.12+) are implemented in C and compose well.

## Code Example

```python
from itertools import batched, islice

def fetch_all(client):
    page = client.get("/items")
    while page:
        yield from page["items"]
        page = client.get(page["next"]) if page.get("next") else None

for chunk in batched(fetch_all(client), 500):   # stream, upload in batches
    bulk_insert(chunk)

preview = list(islice(fetch_all(client), 10))    # bounded materialisation
```

## Testing and Debugging

Test generators by consuming them: `assert list(gen) == [...]`. Also test early termination, for example with `next(gen)` followed by `gen.close()`, to prove the resources are released. When "nothing happens", check whether the generator was ever iterated.

## When Not to Use Generators

Avoid them when you need random access or `len()`, when multiple consumers need the same data (use a list), or when the data is small and clarity matters more.
