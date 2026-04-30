# AGENTS.md

## Library

`knex-tiny-logger` is a small query logging and tracing library for Knex. It should stay easy to install, easy to call, and easy to replace with custom logging/tracing integrations.

## Principles

- Prefer KISS and YAGNI. Add code only for behavior the package needs now.
- Follow the principle of least surprise: public API names, options, defaults, and runtime behavior should match what users naturally expect. 
- Keep breaking changes intentional and obvious.
- Keep the default experience Apple-simple: one obvious call should work out of the box.
- Keep advanced usage flexible: custom loggers, tracer hooks, and subpath exports should be available for users who need control.

## Package

- Keep this a dual package: ESM and CommonJS must both work.
- Keep TypeScript declarations valid for both ESM and CJS consumers.
- Keep `sideEffects: false` unless a real package-level side effect is introduced.

## API Shape

- Keep `knexTinyLogger` focused on wiring Knex events to a logger.
- Keep `tracer` raw: lifecycle, duration, SQL, bindings, errors; no formatting.
- Keep SQL formatting inside string loggers such as `defaultLogger` and `colorfulLogger`.
- Keep structured loggers such as `pinoLogger` structured: send fields, not formatted SQL strings.
- Prefer separate subpath exports for optional integrations.

## Commits

Use Conventional Commits, for example:

- `feat: add tracer subpath export`
- `fix: preserve callable commonjs entrypoint`
- `test: add knex integration coverage`
