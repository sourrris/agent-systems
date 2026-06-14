# Project Profile

This profile outlines the repository's technology stack, commands, boundaries, and conventions.

## Repository purpose

A zero-dependency CLI utility (`agent-systems` / `agent-system`) used to bootstrap standard agent environment configurations, operating protocols, and security policies into target repositories.

## Technology

- Primary languages: JavaScript (ES Modules, Node.js)
- Frameworks: None (Vanilla JS CLI)
- Package manager: npm
- Runtime versions: Node.js >= 16.7.0
- Database and infrastructure: None

## Commands

Use exact commands.

```bash
# Install dependencies
npm install

# Link package locally for CLI development/testing
npm link

# Run help command locally
node bin/cli.js --help
```

## Architecture boundaries

- CLI execution logic is located in `bin/cli.js`.
- The templates and configuration files copied to user repositories are stored in:
  - `.agent-system/`
  - `.agents/`
  - `.claude/`
  - `.codex/`
  - `.opencode/`
  - `AGENTS.md`
  - `CLAUDE.md`
  - `GEMINI.md`
  - `OPENCODE.md`
  - `opencode.json`
- Public CLI compatibility must be maintained for arguments (`init [path]`, `-f`, `--force`, `-h`, `--help`, `-v`, `--version`).

## Coding conventions

- Use standard ES Modules (`import`/`export`) and standard Node.js built-in APIs (`fs`, `path`, `readline`, `url`).
- Keep the codebase zero-dependency.
- Ensure cross-platform compatibility of file system paths using standard `path` utilities.
- Gracefully handle file conflicts by checking for differences and prompting for overwrite when running interactively.

## Protected and sensitive paths

Never inspect or expose secrets. Avoid editing generated or vendored content.

```text
.env
.env.*
secrets/
credentials/
**/*.pem
**/*.key
node_modules/
dist/
build/
vendor/
```

## Risk classification overrides

Always classify these as high risk:

- npm package publishing and package version bumping;
- CLI command argument parsing changes;
- CI/CD, deployment, or production configuration.

## Definition of done

A change is complete only when:

1. acceptance criteria are satisfied;
2. the narrowest useful checks pass;
3. no unrelated changes were introduced;
4. remaining uncertainty is reported honestly.
