---
name: learn-from-run
description: Examine a completed coding run for reusable repository-specific procedure and decide whether to create a skill candidate. Use after substantial work, repeated failures, or explicit requests for self-improvement. Avoid creating skills for one-off facts.
---

# Learn from run

1. Summarize the procedure that actually worked, including failed approaches.
2. Check the learning triggers in
   `.agent-system/core/self-improvement.md`.
3. Search existing skills and candidates before proposing a new one.
4. Decide:
   - `NO_SKILL`: one-off, generic, unverified, or already covered;
   - `UPDATE_CANDIDATE`: existing candidate needs evidence;
   - `NEW_CANDIDATE`: reusable focused workflow is justified.
5. For a candidate, define exact trigger and exclusions, inputs and outputs,
   deterministic steps, safety boundaries, representative evals, baseline, and
   expected improvement.
6. Delegate candidate authoring to the skill librarian or use the
   `create-candidate-skill` skill.
7. Create no more than the configured candidate limit per run.
8. Report the decision and evidence.

Do not modify active skills or governing instructions.
