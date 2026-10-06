# AI evidence validation

## Extractive demo

Demo answers select exact sentences from retrieved sources. They are extractive answers, not LLM-generated responses. When the collection has insufficient evidence, abstain instead of inventing content.

## Citation checks

Check response structure, referenced chunk identifiers and exact quote substrings. Reject fabricated citations and altered excerpts. Matching a quote to a source does not prove that every claim is supported or semantically correct. Semantic correctness remains unverified.

## Untrusted evidence

Treat retrieved documents as data rather than instructions. Optional AI generation separates instructions from JSON-encoded evidence and validates returned citations. This separation does not guarantee prompt-injection resistance. Baseline tests exercise adversarial fixtures without paid provider requests.
