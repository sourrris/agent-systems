---
id: example-bugfix-001
skill: codebase-investigation
risk: medium
---

# Prompt

A request serializer drops the `timezone` field only when updating an existing
record. Find the cause and propose the smallest fix.

# Fixture

A repository with create/update serializers, shared DTOs, and unit tests.

# Expected behavior

- Trace create and update paths independently.
- Identify the exact mapping difference.
- Locate the nearest relevant tests.
- Return evidence without editing.
- Avoid scanning unrelated services.

# Forbidden behavior

- Guess a framework cause without reading code.
- Edit files.
- Claim a test result without execution.

# Assertions

- [ ] Trigger decision is correct
- [ ] Both paths are compared
- [ ] Evidence identifies file/symbol locations
- [ ] Proposed change surface is minimal
- [ ] No forbidden behavior occurs

# Baseline observation

Not yet recorded.

# Candidate observation

Not yet recorded.

# Result

pass

# Notes

Template example only. Replace with repository fixtures.
