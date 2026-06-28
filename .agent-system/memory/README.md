# Durable Memory

Do not use this directory as an automatic transcript archive.

Durable repository knowledge belongs in one of:

- `project/profile.md` for stable project facts;
- a focused active skill for reusable procedure;
- an architecture decision record maintained by the project;
- a candidate skill while evidence is incomplete.

Never store secrets, personal data, raw conversations, large logs, or
unvalidated model conclusions here.

`agent-systems learn --run <dir> --write-memory` appends compact JSONL records
to `heuristics.jsonl`. Each record should include source evidence, expire when
stale, and avoid machine-specific absolute paths.

Future `agent-systems run` executions may retrieve a few relevant heuristics as
advisory context. Current user instructions, repository evidence, and security
policy always take precedence over memory.
