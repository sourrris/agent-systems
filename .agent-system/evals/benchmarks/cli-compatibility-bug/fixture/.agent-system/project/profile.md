# Project Profile

## Repository purpose

Small benchmark fixture for CLI argument compatibility.

## Technology

- Primary languages: JavaScript
- Frameworks: None
- Package manager: npm
- Runtime versions: Node.js
- Database and infrastructure: None

## Commands

Use exact commands.

```bash
# Run tests
npm test
```

## Architecture boundaries

- CLI parsing is in `bin/tool.js`.
- Tests are in `tests/run-tests.js`.

## Coding conventions

- Preserve public CLI behavior.
- Keep argument parsing changes tightly scoped.

## Protected and sensitive paths

Never inspect or expose secrets.

```text
.env
.env.*
secrets/
credentials/
```

## Risk classification overrides

- CLI argument parsing changes are high risk.

## Definition of done

1. Global flags work anywhere in the argument list.
2. Init behavior still works.
3. `npm test` passes.
