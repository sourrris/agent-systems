---
name: verify-change
description: Verify a coding change with fresh commands and runtime evidence, starting narrow and expanding according to risk. Use after implementation or repair. Do not change production code.
---

# Verify change

Do not edit production code.

1. Read acceptance criteria, project commands, diff, and reviewer findings.
2. Select the narrowest command capable of detecting the intended behavior.
3. Run targeted tests, affected package checks, broader suites for medium/high
   risk, and runtime or integration checks when practical.
4. Record exact commands and observed exit status.
5. Distinguish patch-caused failure, pre-existing failure, environmental blocker,
   and unverified area.
6. Never reinterpret a failed relevant check as success.
7. Do not modify tests merely to force green results.
8. Return acceptance criterion to evidence mapping, commands and outcomes,
   failures, checks not run and why, and a completion recommendation.

Test-generated temporary files may be cleaned up if safe.
