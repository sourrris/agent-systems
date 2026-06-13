---
name: codebase-investigation
description: Trace an existing code path, bug, feature, or test through the repository and return evidence-backed findings. Use before non-trivial changes or when current behavior is unclear. Do not edit files.
---

# Codebase investigation

Operate read-only.

1. Read the task contract and project profile.
2. Locate entry points using precise names, errors, routes, symbols, or tests.
3. Trace only the relevant callers, callees, configuration, and data flow.
4. Find existing tests and the nearest analogous implementation.
5. Check version-control history only when current code does not explain intent.
6. Maintain competing hypotheses for bugs. For each, identify a disconfirming
   check.
7. Note architecture constraints, generated files, compatibility requirements,
   and risky boundaries.
8. Stop expanding context when the execution path and likely change surface are
   sufficiently evidenced.
9. Return the structure in `.agent-system/contracts/agent-result.md`.

Required output:

- current behavior;
- execution path with file and symbol references;
- likely change surface;
- relevant tests and commands;
- unresolved uncertainty;
- no edits.
