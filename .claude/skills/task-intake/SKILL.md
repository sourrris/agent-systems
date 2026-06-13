---
name: task-intake
description: Frame a coding task into outcome, acceptance criteria, non-goals, constraints, risk, and verification evidence. Use at the start of ambiguous or non-trivial implementation work. Do not use for a tiny obvious edit.
---

# Task intake

1. Read the user request and applicable repository instructions.
2. Write a compact internal task contract using
   `.agent-system/contracts/task-contract.md`.
3. Separate requested outcome from the user's suggested implementation.
4. Identify non-goals so adjacent cleanup does not enter scope.
5. Classify risk:
   - small: localized and reversible;
   - medium: behavioral or multi-file;
   - high: security, data, concurrency, billing, public compatibility,
     deployment, or cross-system.
6. Define observable acceptance evidence before editing.
7. Resolve questions from repository evidence first.
8. Ask only when an unresolved choice is costly, irreversible, or materially
   changes expected behavior.
9. Hand the framed task to investigation or direct implementation according to
   `.agent-system/core/orchestration.md`.

Output a concise task frame, not a long essay.
