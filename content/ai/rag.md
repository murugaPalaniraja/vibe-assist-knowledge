---
id: rag
title: Retrieval-Augmented Generation (RAG)
description: How retrieval-augmented generation works (chunking, retrieval, grounding, citations), when simpler web grounding is enough, common RAG failures, and a review checklist.
summary: Retrieval-augmented generation answers questions by first retrieving relevant documents and then asking an LLM to answer using only that retrieved context. It keeps answers current and citable without retraining the model, but quality depends heavily on retrieval.
category: ai-engineering
technology: [LLMs]
concepts: [retrieval, chunking, embeddings, vector search, keyword search, hybrid search, reranking, grounding, citations, evaluation]
difficulty: intermediate
tags: [rag, llm, retrieval, search, ai-engineering]
vibe:
  understand: RAG is an open-book exam. Find the right pages first, then answer from them and cite them.
  learn: Learn chunking, keyword vs embedding vs hybrid retrieval, reranking, prompt grounding with citations, and retrieval evaluation.
  review: Check chunking strategy, whether answers cite sources, what happens when nothing relevant is found, access control on retrieved documents, and evaluation data.
  apply: Start with the simplest retrieval that works (web or keyword search), add vector search only when needed, and always measure retrieval quality.
  prompt: Ask the agent how it evaluates retrieval quality and what the system answers when no relevant document exists.
review_checklist:
  - Answers cite the retrieved sources; unsupported claims are discouraged in the prompt
  - The system says "not found" instead of guessing when retrieval returns nothing relevant
  - Chunks keep enough context (headings, titles) to be understood alone
  - Retrieval respects document permissions (no cross-user/tenant leakage)
  - Retrieved text is treated as data, not instructions (prompt-injection aware)
  - Retrieval quality is measured (recall@k on a labelled question set)
  - Index refresh/versioning is defined so stale documents are removed
related: [llm-fundamentals, ai-agents, prompt-engineering, database-indexing]
prompts: [ai-agent-output-verification-prompt, architecture-review-prompt]
sources:
  - title: Lewis et al. — Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (2020)
    url: https://arxiv.org/abs/2005.11401
  - title: Microsoft Learn — Add a public website as a knowledge source (Copilot Studio)
    url: https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-add-public-website
updated: 2026-09-24
---

## What is RAG?

**Retrieval-Augmented Generation** combines a **retriever**, which finds relevant text, with a **generator** (an LLM) that writes an answer grounded in that text. The model's own training data supplies the language skill, and the retrieved documents supply the facts.

## How It Works

1. **Ingest.** Collect documents, clean them, split them into **chunks** and index them (a keyword index, vector embeddings, or both).
2. **Retrieve.** Turn the user's question into a query and fetch the top-k chunks, optionally **reranking** them.
3. **Augment.** Put the chunks into the prompt with instructions to answer only from them and to cite sources.
4. **Generate.** The LLM answers, ideally with citations.

## Retrieval Options

| Approach | Good at | Weak at |
|---|---|---|
| Keyword (BM25) | Exact terms, identifiers, error messages | Synonyms, paraphrases |
| Embeddings / vector search | Semantic similarity | Exact identifiers, rare terms |
| Hybrid + reranker | Both | More moving parts |
| Web search grounding | Public, well-structured sites with no infrastructure | Control over ranking, freshness of the index |

**Vibe-Assist's MVP uses the simplest option.** This knowledge site is public, statically rendered and indexable, and a Copilot agent grounds its answers through web search over it. There is no vector database. That is why every page has a single topic, descriptive headings, a clean URL and a sitemap entry.

## Common Mistakes

- **Bad chunking.** Splitting mid-table or mid-code-block, or chunks without their heading context.
- **Too many or too few chunks.** Irrelevant context dilutes the answer; too little misses facts.
- **No "I don't know" path.** The model fills gaps with hallucinations.
- **Ignoring permissions.** Retrieving documents the user may not see.
- **Treating retrieved text as instructions**, which enables indirect prompt injection.
- **Adding a vector database before measuring** whether simple search already works.

## Evaluation

Create a question set with known relevant documents. Measure **retrieval recall@k** (was the right chunk retrieved?) separately from **answer faithfulness** (did the answer stick to the sources?). Most RAG quality problems are retrieval problems.

## When Not to Use RAG

Skip it when the knowledge is small enough to fit in the prompt directly, or when the task is about style or format rather than facts, where fine-tuning or examples fit better.
