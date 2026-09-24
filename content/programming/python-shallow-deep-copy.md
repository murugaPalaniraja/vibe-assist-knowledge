---
id: python-shallow-deep-copy
title: Python Shallow Copy vs Deep Copy
description: Assignment vs shallow copy vs deep copy in Python, the copy module, mutable default arguments and aliasing bugs, with a checklist for reviewing agent code.
summary: Python assignment binds another name to the same object. copy.copy() creates a new outer object that shares nested objects, while copy.deepcopy() recursively copies nested objects. Aliasing of mutable objects is a frequent source of bugs in generated code.
category: programming
technology: [Python]
concepts: [assignment, aliasing, shallow copy, deep copy, copy module, mutable default arguments, immutability]
difficulty: beginner
tags: [python, copy, mutability, objects]
vibe:
  understand: In Python, names are labels on objects. b = a creates two labels on one object, not two objects.
  learn: Learn copy.copy vs copy.deepcopy, slicing and dict.copy as shallow copies, and why mutable default arguments are shared.
  review: Look for mutable default arguments, shared nested dicts/lists after a shallow copy, and deepcopy on large objects in hot paths.
  apply: Prefer immutable data (tuples, frozen dataclasses), copy at boundaries, and use deepcopy only when nested mutation must be isolated.
  prompt: Ask the agent to identify every mutable object that is shared between callers, requests or threads.
review_checklist:
  - No mutable default arguments (def f(x=[])); use None and create inside
  - Shallow copies (dict.copy(), list[:], copy.copy) are not relied on to isolate nested data
  - Module-level mutable state is not mutated per request
  - deepcopy is not used on large objects in hot paths or on objects holding locks, sockets or clients
  - Dataclasses that should be value objects use frozen=True
  - Configuration/templates are copied before per-request modification
related: [java-object-copying, python-generators, python-mro]
prompts: [agent-change-review-prompt]
sources:
  - title: Python docs — copy module
    url: https://docs.python.org/3/library/copy.html
  - title: Python FAQ — Why are default values shared between objects?
    url: https://docs.python.org/3/faq/programming.html#why-are-default-values-shared-between-objects
updated: 2026-09-24
---

## What is Shallow vs Deep Copy?

| Operation | New outer object? | Nested objects |
|---|---|---|
| `b = a` | No | Same |
| `copy.copy(a)`, `a[:]`, `a.copy()`, `dict(a)` | Yes | **Shared** |
| `copy.deepcopy(a)` | Yes | Recursively copied |

## How It Works

`copy.copy` calls the object's `__copy__` or uses its reduce protocol to build a new container that holds references to the same elements. `copy.deepcopy` walks the object graph. It uses a `memo` dict to handle cycles and shared references, and calls `__deepcopy__` where defined.

```python
import copy
config = {"retry": {"max": 3}}
shallow = copy.copy(config)
shallow["retry"]["max"] = 10
print(config["retry"]["max"])   # 10 — nested dict was shared

deep = copy.deepcopy(config)
deep["retry"]["max"] = 5
print(config["retry"]["max"])   # still 10
```

## Common Mistakes

- **Mutable default arguments.** `def add(item, items=[])` shares one list across all calls.
- **`[[0] * 3] * 3`** creates three references to the same inner list.
- **Shallow-copying a template dict per request** and then mutating nested keys, which leaks state between requests.
- **Deep-copying objects that own resources** (clients, locks, file handles). Depending on the type, this fails or produces a broken copy.

## Performance Considerations

`deepcopy` is slow: it runs in Python and walks the whole graph. In hot paths, prefer immutable structures (tuples, `frozenset`, frozen dataclasses) or targeted copies of only what changes, such as `{**base, "key": new}` or `dataclasses.replace(obj, field=value)`.

## Code Example

```python
from dataclasses import dataclass, field, replace

@dataclass(frozen=True)
class RetryPolicy:
    max_attempts: int = 3
    backoff_s: float = 0.5

def add_tag(tag: str, tags: list[str] | None = None) -> list[str]:
    tags = [] if tags is None else list(tags)   # fresh list, caller's list untouched
    tags.append(tag)
    return tags

strict = replace(RetryPolicy(), max_attempts=1)   # copy-with-change, original unchanged
```

## Testing

Mutate the input after calling the function, and mutate the output, then assert that the other side is unaffected. Call a function with a default argument twice and check that the results are independent.

## When to Use Deep Copy

Use it for snapshots of nested mutable data (undo stacks, test fixtures) or for isolating a mutable template per use, when the graph is small and holds no resources.
