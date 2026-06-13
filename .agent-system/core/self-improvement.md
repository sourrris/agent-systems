# Self-Improvement Policy

The system improves by creating and validating reusable skills. It does not
silently rewrite its constitution, security rules, or project requirements.

## Learning triggers

Run a learning check after substantial work. A candidate skill is justified when
at least one trigger is met:

- the same multi-step procedure appeared in three or more runs;
- a failure recurred and a stable prevention procedure was discovered;
- repository-specific setup or verification required non-obvious steps;
- a successful workflow has clear inputs, outputs, and boundaries;
- the user explicitly requests a reusable skill.

Do not create a skill for generic knowledge, a one-off fix, or an unverified
hunch.

## Candidate contents

```text
.agent-system/candidates/<skill-name>/
├── SKILL.md
├── proposal.md
├── evals/
│   └── case-001.md
└── references/ or scripts/   # only when necessary
```

Follow:

- `.agent-system/contracts/skill-proposal.md`
- `.agent-system/contracts/eval-case.md`

## Candidate constraints

A candidate must solve one focused job, state triggers and exclusions, use
imperative testable instructions, avoid secrets and machine-specific paths,
avoid granting permissions, avoid changing governing policies, include failure
and boundary behavior, and include at least one representative eval.

## Evaluation

Compare candidate-assisted behavior with the current baseline.

Minimum promotion evidence:

- all safety checks pass;
- no regression in correctness;
- measurable improvement in reliability, context efficiency, repeatability, or
  verification quality;
- trigger description selects relevant tasks and avoids obvious false positives;
- instructions work in both Claude Code and Codex, or the limitation is stated.

Three or more representative cases are preferred before automatic promotion.

## Promotion modes

### Default: validated manual promotion

Agents may automatically create candidate skills. Promotion requires an explicit
user request or running `scripts/promote_skill.py`.

### Optional: validated auto-promotion

Opt in by changing `.agent-system/project/improvement-settings.json` to:

```json
{"promotion_mode": "validated-auto"}
```

Automatic promotion is allowed only when at least three eval cases pass, the
skill does not touch security, permissions, deployment, dependencies, secrets,
governance, or destructive operations, it does not modify root instructions,
and rollback is a simple deletion or version-control revert.

The agent must report every auto-promotion.

## Forbidden self-modification

Agents must never autonomously change:

- `AGENTS.md`;
- `CLAUDE.md`;
- `.agent-system/core/`;
- `.agent-system/project/profile.md` (except to initialize it or fill in missing fields/TODOs based on discovery);
- harness permission settings;
- protected branch or CI policy.

They may propose such changes to the user with evidence.

## Skill retirement

Disable or remove a skill when its assumptions no longer match the repository,
it conflicts with current rules, eval performance regresses, it triggers
incorrectly, or a simpler built-in workflow replaces it.
