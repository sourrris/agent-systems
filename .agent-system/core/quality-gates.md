# Quality Gates

## Gate 1: Requirement

Before editing:

- acceptance criteria are concrete;
- non-goals are known;
- risky assumptions are surfaced;
- current behavior has repository evidence.

## Gate 2: Design

Before a non-trivial edit:

- the execution path is identified;
- the chosen change is smaller than credible alternatives;
- compatibility and failure behavior are considered;
- the validation plan can detect likely regressions.

## Gate 3: Patch

Before review:

- diff is limited to authorized scope;
- no debug code, placeholders, or unexplained suppressions remain;
- error paths are handled;
- relevant tests changed with behavior;
- generated artifacts follow project policy.

## Gate 4: Independent review

Required for medium and high risk.

Reviewer checks requirement mismatch, incorrect assumptions, security and
privacy issues, races and state inconsistency, API/schema compatibility, missing
negative tests, accidental complexity, and unrelated change.

Severity:

- `BLOCKER`: unsafe, destructive, or requirement-breaking;
- `MAJOR`: likely bug or material regression;
- `MINOR`: maintainability issue worth fixing;
- `NOTE`: optional observation.

BLOCKER and MAJOR findings must be resolved or explicitly accepted by the user.

## Gate 5: Verification

A successful report includes exact commands, exit status or observed behavior,
scope of each check, failures and attribution, plus checks not run and why.

No simulated results. No "should pass."

## Gate 6: Completion

Complete only when acceptance evidence exists, required findings are resolved,
relevant checks pass or blockers are transparent, the final diff is inspected,
and residual risks are reported.
