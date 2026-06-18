---
name: doitforme
description: Master workflow that routes a coding task through the repository's investigation, planning, implementation, review, verification, and learning loop.
disable-model-invocation: true
---

# Doitforme

Use this skill when the user asks for the doitforme workflow.

1. Preserve the user's exact requested outcome and define acceptance evidence.
2. Prefer the platform-native `doitforme` agent when available:
   - Codex: `.codex/agents/doitforme.toml`;
   - Claude Code: `.claude/agents/doitforme.md`;
   - OpenCode: `.opencode/agents/doitforme.md`;
   - Cursor: `.cursor/rules/doitforme.mdc`.
3. Do not recursively delegate from `doitforme` to `doitforme`.
4. If delegation is unavailable or already active, execute the workflow inline:
   - read `.agent-system/project/profile.md`;
   - follow `.agent-system/core/operating-protocol.md`;
   - follow `.agent-system/core/orchestration.md`;
   - use investigator, planner, implementer, reviewer, verifier, and
     skill-librarian subagents when the task risk or context volume warrants it.
5. Use the smallest relevant context and smallest coherent patch.
6. Do not modify unrelated user changes or expose secrets.
7. Run fresh verification before claiming success.
8. After substantial work, run the learning check and create a candidate skill
   only when `.agent-system/core/self-improvement.md` says the threshold is met.

Return the standard completion report: what changed, why, files changed,
verification commands and outcomes, remaining risks, and whether a skill
candidate was created.
