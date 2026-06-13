---
name: create-candidate-skill
description: Create an eval-ready Agent Skill candidate under .agent-system/candidates from a proven repeated workflow. Use only after the learning threshold is met. Never activate or promote the skill.
---

# Create candidate skill

Allowed write scope:

```text
.agent-system/candidates/<skill-name>/**
```

1. Read `.agent-system/core/self-improvement.md`.
2. Confirm the workflow meets a learning trigger.
3. Confirm no active skill already covers it.
4. Choose a lowercase hyphenated name.
5. Create `SKILL.md`, `proposal.md`, `evals/case-001.md`, and optional
   references, scripts, or assets only when necessary.
6. `SKILL.md` must use Agent Skills frontmatter with `name` and a precise
   `description`.
7. Front-load trigger words and state exclusions.
8. Use imperative instructions with explicit inputs, outputs, stop conditions,
   and verification.
9. Make scripts deterministic, narrow, and safe. Do not embed secrets or
   absolute machine paths.
10. Create additional eval cases when evidence is available.
11. Validate with `python3 scripts/validate_agent_system.py`.
12. Return the candidate path, reason, eval coverage, and promotion blockers.

Never write into `.agents/skills/`, `.claude/skills/`, root instructions, core
policies, or permission settings.
