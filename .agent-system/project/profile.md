# Project Profile

Replace every `TODO` before relying on autonomous implementation.

## Repository purpose

TODO: Describe the product, users, and critical business behavior.

## Technology

- Primary languages: TODO
- Frameworks: TODO
- Package manager: TODO
- Runtime versions: TODO
- Database and infrastructure: TODO

## Commands

Use exact commands. Delete commands that do not apply.

```bash
# Install
TODO

# Fast checks
TODO

# Lint
TODO

# Type check
TODO

# Unit tests
TODO

# Integration tests
TODO

# Full verification
TODO

# Build
TODO
```

## Architecture boundaries

- TODO: State where domain logic belongs.
- TODO: State allowed dependency direction.
- TODO: State public API compatibility requirements.
- TODO: State data migration rules.
- TODO: State generated-code locations.

## Coding conventions

- Follow existing local conventions before introducing new patterns.
- Prefer readable, typed, testable code.
- Do not add a production dependency without explicit justification.
- Do not perform broad refactors inside an unrelated change.
- TODO: Add naming, formatting, error-handling, and logging conventions.

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

TODO: Add repository-specific protected paths.

## Risk classification overrides

Always classify these as high risk:

- authentication and authorization;
- cryptography and secret handling;
- billing, money, or irreversible side effects;
- schema migrations and destructive data operations;
- concurrency and distributed consistency;
- public API or serialization changes;
- CI/CD, deployment, or production configuration.

TODO: Add project-specific high-risk domains.

## Definition of done

A change is complete only when:

1. acceptance criteria are satisfied;
2. relevant tests were added or updated;
3. the narrowest useful checks pass;
4. broader checks were run when risk justifies them;
5. no unrelated changes were introduced;
6. remaining uncertainty is reported honestly.
