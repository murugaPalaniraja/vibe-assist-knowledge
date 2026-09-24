---
id: python-mro
title: Python Method Resolution Order (MRO) and super()
description: How Python's C3 method resolution order works with multiple inheritance, what super() really calls, mixins, and what to review in agent-generated class hierarchies.
summary: The method resolution order is the sequence of classes Python searches when looking up an attribute. Python computes it with C3 linearization, and super() moves to the next class in the MRO of the instance, not simply to the parent class.
category: programming
technology: [Python]
concepts: [MRO, C3 linearization, multiple inheritance, super, mixins, cooperative inheritance]
difficulty: advanced
tags: [python, oop, inheritance, mro]
vibe:
  understand: Python looks up methods along Class.__mro__. super() means "the next class in that list", which can be a sibling class, not the parent.
  learn: Learn C3 linearization, cooperative super() with **kwargs, and how mixins are ordered.
  review: Check for hierarchies where some classes call Parent.method(self) directly (breaking cooperation), inconsistent __init__ signatures, and deep diamond hierarchies.
  apply: Prefer composition. When using mixins, keep them small, put them left of the base class, and make every __init__ cooperative.
  prompt: Ask the agent to print Class.__mro__ for new classes and explain why the order is correct.
review_checklist:
  - New multiple-inheritance hierarchies have a printed/verified __mro__
  - All classes in a cooperative hierarchy call super() (none call Base.method(self) directly)
  - __init__ methods accept and forward **kwargs when used with mixins
  - Mixins are listed before the concrete base class
  - Composition was considered before adding another inheritance level
related: [solid-principles, python-generators, python-shallow-deep-copy]
prompts: [architecture-review-prompt, concept-learning-prompt]
sources:
  - title: The Python 2.3 Method Resolution Order (docs.python.org HOWTO)
    url: https://docs.python.org/3/howto/mro.html
  - title: Python docs — super()
    url: https://docs.python.org/3/library/functions.html#super
updated: 2026-09-24
---

## What is the MRO?

Every class has a `__mro__` tuple, the linear order in which Python searches for attributes. For single inheritance it is simply the chain up to `object`. For multiple inheritance, Python uses **C3 linearization**, which guarantees three things:

- Each class comes before its parents.
- The order of base classes in the `class` statement is preserved.
- The order is consistent across the whole hierarchy. If no consistent order exists, Python raises `TypeError` at class creation.

## How super() Works

`super().method()` looks up `method` starting **after the current class in the MRO of `type(self)`**. In a diamond, the "next" class can be a sibling:

```python
class Base:
    def save(self): print("Base")

class AuditMixin(Base):
    def save(self):
        print("Audit"); super().save()

class CacheMixin(Base):
    def save(self):
        print("Cache"); super().save()

class Repo(AuditMixin, CacheMixin): pass

print([c.__name__ for c in Repo.__mro__])
# ['Repo', 'AuditMixin', 'CacheMixin', 'Base', 'object']
Repo().save()   # Audit, Cache, Base — each runs exactly once
```

## Common Mistakes

- **Calling `Base.save(self)` directly** in one class. This breaks the chain, so some mixins never run and others run twice.
- **Incompatible `__init__` signatures.** Cooperative classes should accept `**kwargs` and pass them to `super().__init__(**kwargs)`.
- **Mixin ordering.** `class Repo(Base, AuditMixin)` can shadow the mixin's methods, so put mixins first.
- **Deep hierarchies generated to "reuse code"** where composition would be clearer.

## Debugging

Print `Cls.__mro__` or `Cls.mro()`. To find out which class supplies a method, check `[c for c in Cls.__mro__ if "save" in c.__dict__]`.

## When to Use Multiple Inheritance

Use it for small, focused mixins, such as adding `__repr__` or serialisation behaviour. For most service code, prefer composition: pass collaborators in instead of inheriting them (see [SOLID](/solid-principles)).
