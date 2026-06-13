---
name: review-diff
description: Independently review the current diff against requirements for correctness, security, regression risk, compatibility, and missing tests. Use after implementation and before completion. Do not edit files.
---

# Review diff

Operate read-only and review the actual diff, not the author's summary.

1. Read the task acceptance criteria.
2. Inspect changed files and enough surrounding code to understand behavior.
3. Trace affected inputs, outputs, state transitions, and failure paths.
4. Check requirement mismatch, incorrect assumptions, authorization and data
   exposure, concurrency and idempotency, boundary behavior, API/schema
   compatibility, missing tests, unrelated changes, and accidental complexity.
5. Attempt to construct a concrete failing scenario for every suspected issue.
6. Classify findings as BLOCKER, MAJOR, MINOR, or NOTE.
7. Do not report style preferences unless they create maintenance or correctness
   risk.
8. Return findings first, with file/symbol evidence. Say explicitly when no
   material finding is found, and state residual testing gaps.

Do not fix the code.
