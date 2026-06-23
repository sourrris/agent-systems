# Project Profile

## Repository purpose

Small benchmark fixture for scoped refactoring.

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

- Pricing behavior is in `src/pricing.js`.
- Tests are in `tests/run-tests.js`.

## Coding conventions

- Preserve public exports.
- Do not edit tests for a behavior-preserving refactor.

## Protected and sensitive paths

Never inspect or expose secrets.

```text
.env
.env.*
secrets/
credentials/
```

## Risk classification overrides

- Behavior-preserving refactors are medium risk.

## Definition of done

1. Duplicate tax logic is centralized.
2. Behavior remains unchanged.
3. Tests pass.
