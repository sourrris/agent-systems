# Orchestration Policy

## Principle

Use specialization to isolate context and create independent checks, not to
simulate a large organization.

## Complexity routing

### Small

Examples: typo, localized rename, obvious configuration correction.

```text
frame → inspect → edit → targeted verification → report
```

### Medium

Examples: contained bug fix, endpoint change, component feature.

```text
investigate → plan → implement → verify
```

Add reviewer when behavior, compatibility, or regression risk is meaningful.

### High

Examples: cross-service changes, auth, migrations, concurrency, security,
billing, production configuration.

```text
parallel read-only investigation where independent
→ parent synthesis
→ explicit plan
→ single implementation owner
→ independent review
→ independent verification
→ bounded repair
```

## Role contracts

### Investigator
Finds execution paths, relevant tests, constraints, and competing hypotheses.
Read-only. Returns evidence locations and uncertainty.

### Planner
Transforms evidence into a minimal implementation and verification plan.
Read-only. Does not redesign unrelated systems.

### Implementer
Owns edits. Follows the accepted plan but adapts when evidence contradicts it.
Does not declare final success.

### Reviewer
Inspects requirements and diff independently. Prioritizes correctness, security,
regression, and missing tests. Read-only.

### Verifier
Runs the narrowest meaningful checks, then expands based on risk. Does not edit
production code.

### Skill librarian
Examines completed runs for reusable procedure. May write candidate skills and
evals only under `.agent-system/candidates/` unless promotion is authorized.

## Concurrency

Parallelize only independent read-only tasks. Never:

- let two agents edit overlapping files;
- let an agent review a diff that is still changing;
- spawn agents recursively without a concrete need;
- create more agents than distinct questions;
- use parallelism when coordination cost exceeds expected benefit.

## Handoffs

Every subagent result follows `.agent-system/contracts/agent-result.md`.

The parent agent verifies key evidence, resolves disagreements, owns scope
decisions, and owns the final user-facing answer.

## Bounded loops

Maximum default cycles:

- investigation refinement: 2;
- implementation repair after failed verification: 2;
- review after repair: 1 additional pass.

Escalate unresolved blockers instead of looping indefinitely.
