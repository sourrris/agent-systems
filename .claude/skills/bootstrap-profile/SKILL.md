---
name: bootstrap-profile
description: Check if the repository profile is missing or has TODO placeholders, auto-detect the project's language, packages, and test commands, and write a complete profile.md.
---

# Bootstrap Profile

1. Locate `.agent-system/project/profile.md`. If it is complete and has no generic `TODO`s, terminate successfully.
2. Inspect the repository root for package/dependency manifests:
   - Python: `requirements.txt`, `pyproject.toml`, `setup.py`, `Pipfile`
   - Node/JS: `package.json`
   - Go: `go.mod`
   - Rust: `Cargo.toml`
   - Ruby: `Gemfile`
3. Identify:
   - Primary language and runtime versions.
   - Project frameworks (e.g. React, Flask, Django, FastAPI).
   - Package manager (e.g. npm, pip, cargo, go).
   - Standard build, test, and lint commands.
4. Auto-discover the location of source code and test files.
5. Populate `.agent-system/project/profile.md` with these discovered details, replacing all `TODO` placeholders.
6. Verify that the updated `profile.md` is valid and correct.
