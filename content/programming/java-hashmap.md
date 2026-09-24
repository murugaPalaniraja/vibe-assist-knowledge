---
id: java-hashmap
title: Java HashMap Internals and Correct Usage
description: How Java HashMap works internally (hashing, buckets, resizing, treeification), the equals/hashCode contract, thread-safety, and what to review in agent code.
summary: HashMap stores key-value pairs in an array of buckets indexed by the key's hash. Lookups are O(1) on average only if keys implement equals() and hashCode() consistently and are not mutated while stored.
category: programming
technology: [Java]
concepts: [hashing, buckets, load factor, resizing, treeification, equals and hashCode contract, ConcurrentHashMap]
difficulty: intermediate
tags: [java, collections, hashmap, data-structures]
vibe:
  understand: A HashMap turns a key into a bucket index via hashCode(), then uses equals() to find the exact entry inside that bucket.
  learn: Learn the equals/hashCode contract, load factor and resizing, and why Java 8+ turns long bucket chains into red-black trees.
  review: Check key types for correct equals/hashCode, mutable keys, shared maps accessed from multiple threads, and unbounded maps used as caches.
  apply: Use immutable keys (records are ideal), pre-size maps when the size is known, and use ConcurrentHashMap for shared mutable state.
  prompt: Ask the agent to list every map key type it introduced and show its equals/hashCode, and every map shared across threads.
review_checklist:
  - item: Custom key classes override both equals() and hashCode() consistently (or are records)
  - item: Keys are not mutated after insertion
    why: A changed hashCode puts the entry in the "wrong" bucket, so get() silently returns null.
  - item: A HashMap shared between threads is replaced by ConcurrentHashMap or properly synchronized
  - item: Check-then-act sequences use atomic methods (computeIfAbsent, merge, putIfAbsent)
  - item: Maps used as caches have a size bound or eviction policy
  - item: Iteration does not modify the map except through Iterator.remove() or removeIf()
  - item: Code does not rely on HashMap iteration order (use LinkedHashMap or TreeMap if order matters)
  - item: Null keys/values are handled deliberately (ConcurrentHashMap rejects them)
related: [java-multithreading, java-object-copying, redis-caching, python-shallow-deep-copy]
prompts: [agent-change-review-prompt, concurrency-review-prompt]
sources:
  - title: Java SE 21 API — HashMap
    url: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html
  - title: Java SE 21 API — Object.hashCode and equals
    url: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html
  - title: Java SE 21 API — ConcurrentHashMap
    url: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html
updated: 2026-09-24
---

## What is a HashMap?

`java.util.HashMap<K,V>` is the standard hash-table implementation of `Map`. It allows one `null` key and `null` values, and it makes **no guarantee about iteration order**. `get` and `put` run in constant time on average.

## How HashMap Works

1. **Hash.** `put(key, value)` calls `key.hashCode()`, then mixes the high bits into the low bits (`h ^ (h >>> 16)`) to spread poorly distributed hashes.
2. **Index.** The bucket index is `hash & (table.length - 1)`. The table length is always a power of two.
3. **Bucket.** Each bucket holds a linked list of nodes. `equals()` finds the matching key inside the bucket.
4. **Treeify.** When a bucket holds more than 8 entries and the table has at least 64 slots, the list becomes a red-black tree. Worst-case lookups then cost O(log n) instead of O(n).
5. **Resize.** When `size > capacity × loadFactor` (default `16 × 0.75 = 12`), the table doubles and entries are redistributed.

## The equals/hashCode Contract

- Equal objects **must** have equal hash codes.
- Unequal objects *may* share a hash code, but many collisions degrade performance.
- Both methods must use the same fields, and those fields should be immutable.

Java `record` types generate a correct `equals`/`hashCode` from their components, which makes them the safest choice for composite keys.

## Common Mistakes

- **Overriding `equals` without `hashCode`** (or the reverse). `map.get(new Key("a"))` then returns `null` even though an equal key is present.
- **Mutable keys.** Mutating a field that feeds into `hashCode` after `put` makes the entry unreachable.
- **Using `HashMap` from several threads.** Concurrent `put` calls can lose updates or corrupt the structure. Wrapping reads in `synchronized` without doing the same for writes does not help.
- **Non-atomic check-then-act:** `if (!map.containsKey(k)) map.put(k, v)` is a race even on `ConcurrentHashMap`. Use `putIfAbsent` or `computeIfAbsent`.
- **Unbounded "cache" maps** that grow until the service runs out of memory.
- **`ConcurrentModificationException`** from removing entries inside a for-each loop.

## Performance Considerations

- Pre-size when the element count is known: `HashMap.newHashMap(expectedSize)` (Java 19+) accounts for the load factor for you.
- Poor `hashCode` implementations (for example returning a constant) degrade lookups to O(log n) or O(n).
- `HashMap` boxes primitive keys. For very large maps with primitive keys, consider specialised collections.

## Thread Safety Options

| Need | Use |
|---|---|
| Shared mutable map, high concurrency | `ConcurrentHashMap` |
| Read-mostly, built once | `Map.copyOf(...)` (immutable) |
| Insertion order | `LinkedHashMap` (not thread-safe) |
| Sorted keys | `TreeMap` or `ConcurrentSkipListMap` |

## Code Example

```java
// Composite key as a record: correct equals/hashCode, immutable.
record CacheKey(long tenantId, String sku) {}

Map<CacheKey, Price> prices = new ConcurrentHashMap<>();

Price price(long tenant, String sku) {
  // Atomic: the loader runs at most once per key.
  return prices.computeIfAbsent(new CacheKey(tenant, sku), k -> loadPrice(k));
}
```

Keep `computeIfAbsent` loaders short. They run while part of the map is locked, and they must not modify the same map.

## Testing and Debugging

- Unit-test custom keys: equal instances must have equal `hashCode`s, and a round-trip through `put`/`get` must succeed.
- To debug "value disappeared" bugs, log `key.hashCode()` at insertion and lookup. If the values differ, a key was mutated or `hashCode` is inconsistent.
- Use stress tests (or tools like jcstress) for code that shares maps across threads.

## When Not to Use HashMap

- When keys are enum constants, use `EnumMap`.
- When order matters, use `LinkedHashMap` or `TreeMap`.
- When you need a bounded cache with expiry, use Caffeine or a distributed cache such as [Redis](/redis-caching), not a hand-rolled map.
