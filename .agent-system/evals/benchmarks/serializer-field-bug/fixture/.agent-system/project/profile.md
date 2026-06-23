# Project Profile

## Repository purpose

Small benchmark fixture for serializer behavior.

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

- Serializer code is in `src/serializer.js`.
- Tests are in `tests/run-tests.js`.

## Coding conventions

- Keep fixes small.
- Prefer direct behavior changes over unrelated refactors.

## Protected and sensitive paths

Never inspect or expose secrets.

```text
.env
.env.*
secrets/
credentials/
```

## Risk classification overrides

- Serializer mapping changes are medium risk.

## Definition of done

1. The failing serializer behavior is fixed.
2. `npm test` passes.
3. Unrelated files are unchanged.
