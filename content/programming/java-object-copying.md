---
id: java-object-copying
title: Java Shallow Copy vs Deep Copy and Defensive Copying
description: Shallow vs deep copy in Java, clone(), copy constructors, immutable collections and defensive copies, with a review checklist for agent-written code.
summary: A shallow copy duplicates an object but shares the objects it references; a deep copy duplicates the referenced objects too. In Java, most bugs come from sharing mutable collections or objects across boundaries without a defensive copy.
category: programming
technology: [Java]
concepts: [shallow copy, deep copy, clone, copy constructor, defensive copy, immutability, aliasing]
difficulty: beginner
tags: [java, copy, immutability, objects]
vibe:
  understand: Java variables hold references. Copying a reference, or making a shallow copy, still leaves two owners of the same mutable data.
  learn: Learn copy constructors, List.copyOf, records with defensive copies, and why Cloneable is discouraged.
  review: Look for getters that return internal mutable collections and constructors that store caller-provided lists directly.
  apply: Prefer immutable types, take defensive copies at API boundaries, and deep-copy only when you truly need independent mutable state.
  prompt: Ask the agent which objects cross a trust or thread boundary and whether each is copied, immutable, or shared on purpose.
review_checklist:
  - Constructors copy incoming mutable collections (List.copyOf, new ArrayList<>(x)) instead of storing the caller's reference
  - Getters do not expose internal mutable collections (return unmodifiable views or copies)
  - Records with collection components copy them in the compact constructor
  - clone() is not newly introduced; copy constructors or factory methods are used instead
  - "Deep copies really copy nested mutable objects, not only the top-level container"
  - Objects shared between threads are immutable or safely published
related: [python-shallow-deep-copy, java-hashmap, java-multithreading]
prompts: [agent-change-review-prompt]
sources:
  - title: Java SE 21 API — List.copyOf
    url: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html
  - title: Java SE 21 API — Object.clone
    url: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html
  - title: Java Language Specification — Record Classes
    url: https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.10
updated: 2026-09-24
---

## What is Shallow Copy vs Deep Copy?

In Java, a variable of an object type holds a **reference**.

- **Reference copy:** `b = a`. There is still only one object.
- **Shallow copy:** a new outer object whose fields point to the *same* nested objects. Examples: `new ArrayList<>(list)`, or `Object.clone()` by default.
- **Deep copy:** a new outer object *and* new copies of every mutable object reachable from it.

## Why It Matters

**Aliasing bugs**, where two parts of the program unknowingly share mutable state, are hard to trace. They show up as data that changes "by itself", as caches that get corrupted by callers, and as races when the shared object crosses threads.

## How Copying Works in Java

- `new ArrayList<>(original)` copies the list structure, but the elements are shared.
- `List.copyOf(original)` returns an **unmodifiable** shallow copy and rejects `null` elements.
- `Collections.unmodifiableList(original)` is a **view**, not a copy. Changes to `original` still show through it.
- `Object.clone()` performs a field-by-field shallow copy and requires `Cloneable`. It is widely considered a flawed API (Effective Java, Item 13).

## Defensive Copying

Copy at trust boundaries: when you receive a mutable object from a caller, and when you hand internal state to a caller.

```java
public record Order(String id, List<LineItem> items) {
  public Order {
    items = List.copyOf(items); // defensive + unmodifiable
  }
}

public final class Cart {
  private final List<LineItem> items = new ArrayList<>();
  public List<LineItem> items() {
    return List.copyOf(items);  // callers cannot mutate our state
  }
}
```

If `LineItem` itself is mutable, `List.copyOf` is still only shallow. Make `LineItem` immutable (a record), or deep-copy each element.

## Common Mistakes

- A record with a `List` component and no compact constructor. The record looks immutable but is not.
- Returning `this.items` from a getter. Callers can call `clear()` on it.
- Thinking `Collections.unmodifiableList` protects against changes made by the original owner.
- Deep-copying with serialization round-trips. This is slow, fragile, and does not work with non-serializable fields.

## Performance Considerations

Copies cost allocation and time. Immutable objects can be shared freely and never need copying, which is usually the better design. Copy large collections only at boundaries, not in hot loops.

## Testing

Mutate the input after constructing the object and assert that the object is unchanged. Then try to mutate the returned collection and expect an `UnsupportedOperationException`, or check that the original is unaffected.

## When to Use a Deep Copy

Use one for snapshotting mutable graphs (undo history, audit copies) or for handing independent working state to another thread. Otherwise, prefer immutability.
