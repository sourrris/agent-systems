---
name: implement-change
description: Implement an accepted coding plan as the smallest coherent patch, preserving repository conventions and unrelated work. Use for authorized code changes after sufficient inspection.
---

# Implement change

1. Re-read acceptance criteria, plan, and current working tree.
2. Confirm no relevant files changed since investigation.
3. Edit one coherent behavior at a time.
4. Follow existing architecture and local conventions.
5. Preserve unrelated user changes.
6. Add or update tests with behavior.
7. Do not disable checks, add broad refactors, add dependencies without
   justification, modify generated files manually unless policy requires it, or
   declare the work complete.
8. Run a fast local check after each meaningful unit when practical.
9. Inspect the final diff for scope, accidental deletion, debug code, and
   unsupported assumptions.
10. Hand off the immutable diff to review and verification.

If evidence contradicts the plan, pause, update the plan explicitly, then
continue.
