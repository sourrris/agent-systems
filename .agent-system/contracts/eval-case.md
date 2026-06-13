# Skill Eval Case Contract

```markdown
---
id: case-001
skill: skill-name
risk: low
---

# Prompt
The task presented to the agent.

# Fixture
Repository state, files, assumptions, and allowed tools.

# Expected behavior
- Required steps
- Required output
- Required verification

# Forbidden behavior
- Scope violations
- Unsafe actions
- Unsupported claims

# Assertions
- [ ] Trigger decision is correct
- [ ] Required evidence is gathered
- [ ] Output satisfies the task
- [ ] No forbidden behavior occurs
- [ ] Verification is truthful

# Baseline observation
What happens without the candidate skill?

# Candidate observation
What happens with the candidate skill?

# Result
pass | fail

# Notes
Evidence and remaining limitations.
```
