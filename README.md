# knex-tiny-logger

[![](https://img.shields.io/npm/v/knex-tiny-logger.svg?style=flat-square)](https://npmjs.com/package/knex-tiny-logger)

> Zero-config query logging for Knex. Tiny by default, flexible when needed.

## Install

```bash
# npm
npm install knex-tiny-logger knex

# pnpm
pnpm add knex-tiny-logger knex

# yarn
yarn add knex-tiny-logger knex

# bun
bun add knex-tiny-logger knex

# aube
aube add knex-tiny-logger knex
```

Requires Node.js 20 or newer. Bun 1.3 or newer is also supported.

## Usage

```ts
import createKnex from 'knex'
import knexTinyLogger from 'knex-tiny-logger'

const knex = knexTinyLogger(
  createKnex({
    client: 'pg',
    connection: process.env.DATABASE_URL,
  }),
)
```

By default, `knexTinyLogger` uses `defaultLogger`: plain string logs, no extra runtime dependencies.

```text
SQL (3.421 ms) select 1 as id
SQL ERROR (2.104 ms) select * from missing_table
```

## Default Logger

```ts
import knexTinyLogger, { defaultLogger } from 'knex-tiny-logger'

knexTinyLogger(knex, {
  logger: defaultLogger({ bindings: false }),
})
```

The default logger formats SQL before writing it. By default, it asks Knex to interpolate bindings into the logged SQL.

Set `bindings: false` to write the original SQL with placeholders, or replace formatting completely:

```ts
knexTinyLogger(knex, {
  logger: defaultLogger({
    formatter(query) {
      return query.sql
    },
  }),
})
```

The built-in formatter is also exported if you want the same SQL formatting in a custom logger:

```ts
import { defaultQueryFormatter } from 'knex-tiny-logger'

const formatQuery = defaultQueryFormatter()

knexTinyLogger(knex, {
  logger: {
    onEnd(query) {
      console.log(formatQuery(query), query.durationMs)
    },
  },
})
```

`write` can be a function or a stream-like target:

```ts
knexTinyLogger(knex, {
  logger: defaultLogger({ write: process.stdout }),
})
```

## Colorful Logs

The colorful logger is the same string logger experience, with output colored by query state.
It supports the same `bindings`, `formatter`, and `write` options as `defaultLogger`.

Successful SQL is cyan; failed SQL is red. The message shape otherwise matches `defaultLogger`.

```ts
import knexTinyLogger from 'knex-tiny-logger'
import { colorfulLogger } from 'knex-tiny-logger/colorful'

knexTinyLogger(knex, {
  logger: colorfulLogger(),
})
```

## Pino

The pino adapter keeps query data structured.

```ts
import knexTinyLogger from 'knex-tiny-logger'
import { pinoLogger } from 'knex-tiny-logger/pino'

knexTinyLogger(knex, {
  logger: pinoLogger(pino),
})
```

The pino adapter logs `sql`, `bindings`, and `durationMs`; errors also include `err`.
Bindings are included by default. Set `bindings: false` to omit them from the structured payload.

## Custom Logger

```ts
import type { Logger } from 'knex-tiny-logger'

const logger: Logger = {
  onEnd(query) {
    console.log(query.sql, query.durationMs)
  },
  onError(query) {
    console.error(query.sql, query.error)
  },
}

knexTinyLogger(knex, { logger })
```

Passing a function uses the default string formatting and writes each log message to that function:

```ts
import { defaultLogger } from 'knex-tiny-logger'

knexTinyLogger(knex, { logger: console.log })

// same as
knexTinyLogger(knex, {
  logger: defaultLogger({ write: console.log }),
})
```

## Logger Errors

Logger errors are caught so logging does not break queries. By default they are reported with `console.error`.

```ts
knexTinyLogger(knex, {
  logger,
  onLoggerError(event) {
    diagnostics.warn(event.error)
  },
})
```

## Tracing

For lower-level integrations:

```ts
import { createTracer } from 'knex-tiny-logger/tracer'

const spans = new Map()

const tracer = createTracer(knex, {
  onStart(query) {
    spans.set(query.queryId, tracerProvider.startSpan('sql', {
      sql: query.sql,
      bindings: query.bindings,
    }))
  },
  onEnd(query) {
    spans.get(query.queryId)?.end({ durationMs: query.durationMs })
    spans.delete(query.queryId)
  },
  onError(query) {
    spans.get(query.queryId)?.fail(query.error)
    spans.delete(query.queryId)
  },
})

tracer.dispose()
```

The tracer exposes query lifecycle events with duration, SQL, bindings, and errors.

## License

[MIT](LICENSE.md)
