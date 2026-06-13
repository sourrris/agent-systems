# Agent Systems Installer CLI

Standardized AI agent environment profiles, quality gates, security policies, and memory contracts for **Claude Code**, **Cursor**, **Codex**, and **Antigravity**.

This repository publishes a zero-dependency CLI tool (`agent-systems`) that automatically initializes and standardizes agent guidelines in any codebase, providing immediate alignment and safety policies.

---

## 🚀 Quick Start

Initialize the agent configuration files in your current workspace:

```bash
npx agent-systems
# OR
npx agent-system
```

This will automatically create/copy the standard configuration folders, markdown instructions, and append necessary rules to your `.gitignore`.

### Overwriting Existing Configurations

To force overwrite existing configs (e.g. updating to the latest templates), pass the `--force` or `-f` flag:

```bash
npx agent-systems --force
```

---

## 🛠️ What gets installed?

The initializer copies the following files and directories into the target repository:

### 1. `.agent-system/` (General / Antigravity)
- `project/profile.md`: Defining the project purposes, tech stack, coding boundaries, and definition of done (requires customization after initialization).
- `core/`: Protocols and policies (Operating Protocol, Security Policy, Self Improvement, Context Engineering, Quality Gates, Orchestration).
- `contracts/`: Core data contracts for agents (Task contract, Eval cases, Skill proposals, etc.).
- `memory/`: Repository memory layouts and instructions.
- `evals/`: Evaluation cases.

### 2. `.claude/` (Claude Code)
- `settings.json`: Security rules denying the agent from reading `.env`, `.pem`, `.key`, and other secrets.
- `agents/`: Custom persona files (`investigator`, `planner`, `implementer`, `reviewer`, `verifier`, `skill-librarian`, `doitforme`).
- `skills/`: Basic operational agent skills.

### 3. `.agents/` (Cursor)
- `skills/`: Cursor agent skills matching the system definitions.

### 4. `.codex/` (Codex)
- `agents/`: Custom persona configurations in TOML format (`planner`, `reviewer`, `verifier`, `investigator`, `implementer`, `doitforme`, `skill_librarian`).

### 5. Repository Markdown Instructions
- `AGENTS.md`: Repository level instructions for Cursor & general agents.
- `CLAUDE.md`: Repository instructions specific to Claude Code.

---

## 📦 NPM Package Details

### Commands
- `init [path]`: Copies agent systems configuration to the specified path (defaults to `.`).
- `help` / `-h` / `--help`: Shows CLI help.
- `version` / `-v` / `--version`: Shows package version.

### Local Installation & Development

To link and test the CLI locally:

```bash
npm link
agent-system --help
```

---

## 📄 License

MIT
