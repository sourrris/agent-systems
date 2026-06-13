# Agent Systems

Standardized environment profiles, operating protocols, security policies, and memory contracts for autonomous AI development agents—including **Cursor**, **Claude Code**, **Codex**, **Gemini / Antigravity**, and **GitHub Copilot**.

[![NPM Version](https://img.shields.io/npm/v/agent-systems?style=flat&color=007ACC)](https://www.npmjs.com/package/agent-systems)
[![License](https://img.shields.io/github/license/sourrris/agent-systems?style=flat&color=708090)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-green?style=flat)](package.json)

**Agent Systems** provides a zero-dependency, plug-and-play CLI to instantly bootstrap production-grade, multi-agent coordination frameworks and strict security safeguards directly into any codebase. It standardizes how AI agents analyze, plan, execute, review, and self-improve while ensuring prompt injection resistance and robust code quality gates.

---

## ⚡ Quick Start

Initialize standard configuration profiles, markdown rules, and environment constraints in your workspace directory instantly:

```bash
npx agent-systems
# Or use the singular alias
npx agent-system
```

This command automatically configures standard directories, defines platform-specific rules, and updates your `.gitignore` with safe defaults.

### Options & Flags

```bash
# Overwrite existing files (bypassing interactive prompts)
npx agent-systems --force

# Initialize in a specific subdirectory
npx agent-systems ./my-project-dir

# View full usage instructions
npx agent-systems --help

# Run a custom agent in the current workspace (requires GEMINI_API_KEY or ANTHROPIC_API_KEY)
export GEMINI_API_KEY="your-api-key"
npx agent-systems run doitforme "Optimize the database schema"
```


---

## 🎯 Key Features

*   **🌐 Cross-Platform Standards**: Uniform profiles and configurations for **Cursor**, **Claude Code**, **Codex**, **Gemini / Antigravity**, and **GitHub Copilot**.
*   **🔒 Strict Security Guardrails**: Built-in rules that prevent AI agents from reading, printing, copying, or committing `.env` files, PEM keys, and access tokens.
*   **🧬 Multi-Agent Orchestration**: Standardizes distinct agent persona roles (`investigator`, `planner`, `implementer`, `reviewer`, `verifier`, `skill-librarian`) to handle complex workflows safely.
*   **🛡️ Prompt Injection Resistance**: Instructs agents to treat external text, issues, and logs strictly as data rather than executable instructions.
*   **📈 Quality Gates**: Establishes unambiguous definitions of done, requirement mapping, and verification check hierarchies.
*   **🔄 Local Learning Loops**: Auto-generates folders for capturing durable, reusable context/skills without bloating global agent files.

---

## 📂 Anatomy of Installed Components

When initialized, `agent-systems` installs the following layout:

```text
your-project/
├── .agent-system/               # General agent core standard
│   ├── core/
│   │   ├── context-engineering.md  # Rules for managing token scope
│   │   ├── operating-protocol.md   # Standard step-by-step task loop
│   │   ├── orchestration.md        # Persona separation & subagent control
│   │   ├── quality-gates.md         # Requirements to verify before finish
│   │   ├── security-policy.md      # Commands, dependencies, and secret rules
│   │   └── self-improvement.md     # Guidelines for learning loops & skill library
│   ├── contracts/                  # Shared data schemas for multi-agent runs
│   │   ├── agent-result.md
│   │   ├── context-packet.md
│   │   ├── eval-case.md
│   │   ├── skill-proposal.md
│   │   └── task-contract.md
│   ├── project/
│   │   ├── profile.md              # Project purpose, frameworks, and commands (customizable)
│   │   └── improvement-settings.json
│   ├── candidates/                 # Folder for holding new skill candidates
│   ├── memory/                     # Directory for agent state & memory maps
│   └── evals/                      # Directory for verification/evaluation test cases
├── .claude/                     # Claude Code configurations
│   ├── settings.json               # Hard security path exclusions
│   └── agents/                     # Persona prompts (investigator, planner, etc.)
├── .agents/                     # Shared skills (used by Cursor, Antigravity, and others)
│   └── skills/                     # Custom instructions & operational skills
├── .codex/                      # Codex agent settings
│   └── agents/                     # TOML persona configurations
├── .cursor/                     # Cursor IDE configurations
│   └── rules/                      # .mdc persona rules (agent-system, doitforme, etc.)
├── .gemini/                     # Gemini CLI / Antigravity IDE configurations
│   └── settings.json               # Security file exclusions
├── .github/                     # GitHub Copilot configurations
│   └── copilot-instructions.md     # Repository-wide Copilot instructions
├── AGENTS.md                    # Root instructions for Cursor / Codex / generic agents
├── CLAUDE.md                    # Root instructions for Claude Code
└── GEMINI.md                    # Root instructions for Gemini CLI / Antigravity
```

---

## 🚀 The Multi-Agent Orchestration Architecture

For complex, high-risk, or context-heavy tasks, `agent-systems` divides labor across highly specialized personas:

| Persona | Primary Responsibility | Key Output |
| :--- | :--- | :--- |
| **🕵️ Investigator** | Scopes the codebase, analyzes existing patterns, and gathers ground truths. | Context Packet |
| **📋 Planner** | Formulates step-by-step implementation sequences and validation strategies. | Task Contract |
| **💻 Implementer** | Authors minimal, backward-compatible, clean, and typed code changes. | Small Coherent Patch |
| **🔎 Reviewer** | Performs independent static checks against code quality rules. | Critique & Lint Feedback |
| **✅ Verifier** | Executes tests and provides concrete, fresh verification evidence. | Execution Logs |
| **📚 Skill Librarian** | Curates, optimizes, and registers durable, reusable procedures. | Skill Proposal |

---

## 📈 Six-Stage Quality Gates

All task execution flows are governed by rigorous quality gates to prevent regression:

1.  **Gate 1: Requirement**: Concrete acceptance criteria, known non-goals, and surfaced assumptions.
2.  **Gate 2: Design**: Target execution path identified and validation strategy established.
3.  **Gate 3: Patch**: Verification that changes are limited to scope, errors are handled, and no debug placeholders remain.
4.  **Gate 4: Independent Review**: Mandatory peer review check for medium/high-risk tasks to flag potential bugs or schema incompatibilities.
5.  **Gate 5: Verification**: Execution of tests with real evidence (no "should pass" or simulated results).
6.  **Gate 6: Completion**: Acceptance evidence generated, residual risks reported, and final diff verified.

---

## 🧠 Self-Improvement & Reusable Skills

The system enables agents to self-improve dynamically without bloating main prompt files. When a specific multi-step procedure is used multiple times or a recurring failure is resolved:
1.  The agent proposes a **Skill Candidate** in `.agent-system/candidates/`.
2.  The candidate must include a focused definition, imperative instructions, and evaluation test cases.
3.  Upon successful validation (manual or auto-promotion mode), the skill is promoted to the global system skill library.

---

## 🛠️ Local Development & Contributing

To build, link, and run the CLI tool locally for testing or custom updates:

1.  Clone the repository:
    ```bash
    git clone https://github.com/sourrrish/agent-systems.git
    cd agent-systems
    ```
2.  Link the package locally:
    ```bash
    npm link
    ```
3.  Run the CLI tool anywhere on your local machine:
    ```bash
    agent-system --help
    # Or using the plural form
    agent-systems --help
    ```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
