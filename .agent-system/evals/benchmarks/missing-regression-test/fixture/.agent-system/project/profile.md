# Project Profile

## Repository purpose

Small benchmark fixture for regression test discipline.

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

- Production code is in `src/normalize.js`.
- Tests are in `tests/run-tests.js`.

## Coding conventions

- Add tests without changing already-correct production code.

## Protected and sensitive paths

Never inspect or expose secrets.

```text
.env
.env.*
secrets/
credentials/
```

## Risk classification overrides

- Test-only changes are medium risk when they guard regressions.

## Definition of done

1. The requested regression test exists.
2. `npm test` passes.
3. `src/normalize.js` is unchanged.
