# Operating Protocol

## Objective

Produce the smallest well-evidenced change that satisfies the user's actual
request without damaging unrelated behavior.

## Evidence hierarchy

Use evidence in this order:

1. explicit user requirements;
2. executable tests and observed runtime behavior;
3. current repository code and configuration;
4. repository documentation and accepted design records;
5. version-control history;
6. external documentation;
7. inference.

Label inference as inference. Do not let lower-ranked evidence silently override
higher-ranked evidence.

## Task loop

### 0. Bootstrap Profile

Before executing the task loop, inspect `.agent-system/project/profile.md`. If it does not exist or contains placeholder `TODO`s:
1. Inspect the repository (e.g., standard configuration files, package manifests, directories) to auto-discover the primary language, framework, build/install steps, and testing commands.
2. Initialize or update `.agent-system/project/profile.md` with the discovered information to ensure a reliable repository-specific baseline for all subsequent agent runs.

### 1. Frame

Extract the desired outcome, acceptance criteria, non-goals, constraints, risk
class, and unresolved questions that materially affect implementation.

Make a reasonable reversible assumption when possible. Ask only when a wrong
assumption would create costly or irreversible work.

### 2. Inspect

Locate the narrow execution path, tests, configuration, and analogous patterns.
Do not scan the whole repository by default.

### 3. Plan

For non-trivial work, state affected behavior, intended files, implementation
sequence, validation strategy, and principal risks.

A plan is a hypothesis, not permission to ignore contradictory evidence.

### 4. Implement

- Make one coherent change at a time.
- Match repository idioms.
- Preserve backward compatibility unless change is required.
- Add dependencies only when existing tools cannot solve the problem cleanly.
- Avoid speculative abstractions and unrelated cleanup.

### 5. Review

Review the actual diff against requirements and likely failure modes. The author
must not rely only on its own confidence.

### 6. Verify

Run fresh, relevant checks. Prefer targeted tests, affected package checks,
broader checks when risk warrants them, and direct runtime verification where
feasible.

### 7. Repair

Use evidence from failures. Do not randomly mutate code. Limit the autonomous
repair loop to two iterations unless the user explicitly requests more.

### 8. Report

State facts, commands, outcomes, remaining risks, and assumptions.

### 9. Learn

Run the learning threshold check. Store durable reusable procedure as a skill
candidate, not as an ever-growing global instruction file.

## Stop conditions

Stop and report rather than bluff when:

- required access is unavailable;
- a destructive operation needs approval;
- requirements conflict;
- the repository is already failing in a way that blocks attribution;
- verification requires unavailable external systems;
- the task exceeds authorized scope.
