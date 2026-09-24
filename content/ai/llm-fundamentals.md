---
id: llm-fundamentals
title: Large Language Models (LLMs) for Developers
description: How large language models work (tokens, context windows, sampling), why they hallucinate, and what to review in features that call an LLM.
summary: A large language model predicts the next token of text based on patterns learned from vast training data. It is powerful for generating and transforming language and code, but it has no built-in notion of truth, so outputs must be grounded, constrained and verified.
category: ai-engineering
technology: [LLMs]
concepts: [tokens, context window, next-token prediction, transformer, temperature, hallucination, grounding, fine-tuning vs retrieval, structured output]
difficulty: beginner
tags: [llm, ai, machine-learning, generative-ai]
vibe:
  understand: An LLM continues text one token at a time, choosing likely next tokens given everything in its context window.
  learn: Learn tokens and context limits, sampling (temperature), system vs user prompts, tool calling, and why grounding beats fine-tuning for facts.
  review: Check LLM features for prompt injection exposure, missing output validation, secrets in prompts, unbounded cost, and no fallback on model errors.
  apply: Ground answers with retrieved sources, request structured output and validate it, log prompts and responses safely, and evaluate with test sets.
  prompt: Ask the agent how each LLM call's output is validated before it affects users, data or other systems.
review_checklist:
  - Model output is validated (schema, allow-lists) before use in code, SQL, shell or HTML
  - Untrusted content in prompts is delimited and cannot grant new permissions (prompt-injection aware)
  - No secrets or unnecessary personal data are sent in prompts
  - Timeouts, retries with backoff and fallbacks exist for model/API errors
  - Token usage and cost are bounded (max tokens, input truncation, rate limits)
  - The model/provider is configurable, not hard-coded throughout the codebase
  - Behaviour is evaluated with a fixed test set, not a few manual tries
related: [prompt-engineering, ai-agents, rag]
prompts: [ai-agent-output-verification-prompt, concept-learning-prompt]
sources:
  - title: Vaswani et al. — Attention Is All You Need (2017)
    url: https://arxiv.org/abs/1706.03762
  - title: OWASP Top 10 for Large Language Model Applications
    url: https://owasp.org/www-project-top-10-for-large-language-model-applications/
updated: 2026-09-24
---

## What is a Large Language Model?

An **LLM** is a neural network, usually a **transformer**, trained on large text and code corpora to predict the next **token** (a word piece of roughly 3–4 characters of English). Instruction tuning and reinforcement learning from feedback then shape it to follow instructions and hold conversations.

## How It Works

1. **Tokenisation.** The input text is split into tokens.
2. **Context window.** The model sees the system prompt, conversation, tool results and retrieved documents, up to a maximum number of tokens. Anything outside the window does not exist for the model.
3. **Next-token prediction.** The model computes a probability distribution over the vocabulary.
4. **Sampling.** **Temperature** and top-p control randomness. Low values give more deterministic output.
5. Repeat until a stop condition is reached.

The model's "knowledge" is compressed statistics from training data with a **cutoff date**. It does not look anything up unless you give it tools or retrieved context.

## Key Limitations

- **Hallucination.** Fluent but false statements, invented APIs and fake citations.
- **Non-determinism.** The same prompt can give different answers.
- **Context limits and dilution.** Very long contexts can bury important details.
- **Prompt injection.** Instructions hidden in untrusted input (web pages, documents, code comments) can hijack behaviour.
- **Stale knowledge** after the training cutoff.

## Grounding vs Training

To make an LLM answer from *your* knowledge, **retrieve and supply** the relevant text at query time ([RAG](/rag), or a web-grounded agent such as a Copilot agent using a public website). **Fine-tuning** changes style and format, and is a poor way to add facts that change. Vibe-Assist deliberately uses grounding on this knowledge site and does not train a model.

## Common Mistakes in LLM Features

- Executing model output directly: `eval`, SQL, shell or `innerHTML`.
- Trusting model-produced JSON without schema validation.
- Putting API keys or customer data in prompts that are logged by third parties.
- No evaluation set, so prompt changes silently regress quality.
- Hard-coding a single provider SDK across the codebase.

## Testing and Evaluation

Build a fixed evaluation set of inputs with expected properties. Score outputs automatically where possible (schema validity, required facts present), and use human or LLM-as-judge review for the rest. Re-run it on every prompt or model change.
