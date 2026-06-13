---
name: implementation-plan
description: Produce a minimal evidence-backed coding plan with affected files, invariants, test strategy, and rollback. Use after investigation for medium or high-risk work. Do not edit files.
---

# Implementation plan

Operate read-only.

1. Consume the task frame and investigation evidence.
2. Restate acceptance criteria in observable terms.
3. Select the smallest coherent design that matches repository patterns.
4. List intended files and why each must change.
5. State invariants that must remain true.
6. Include error, boundary, compatibility, and migration behavior where relevant.
7. Define the verification ladder before implementation.
8. Identify rollback for risky changes.
9. Explicitly reject attractive but unnecessary alternatives.
10. Return a sequenced plan with checkpoints.

The plan must be specific enough to execute but must not include fabricated code
details that were not inspected.
