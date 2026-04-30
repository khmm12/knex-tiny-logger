# knex-tiny-logger

> Zero-config query logging for Knex. Tiny by default, flexible when needed.

[![](https://img.shields.io/npm/v/knex-tiny-logger.svg?style=flat-square)](https://npmjs.com/package/knex-tiny-logger)

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

That is the default path: plain output, no extra runtime dependencies.

## String Logs

```ts
import knexTinyLogger, { defaultLogger } from 'knex-tiny-logger'

knexTinyLogger(knex, {
  logger: defaultLogger({ bindings: false }),
})
```

String loggers format SQL before writing it. Use `bindings` for the built-in formatter, or replace formatting completely:

```ts
knexTinyLogger(knex, {
  logger: defaultLogger({
    formatter(query) {
      return query.sql
    },
  }),
})
```

`write` can be a function or a stream-like target:

```ts
knexTinyLogger(knex, {
  logger: defaultLogger({ write: process.stdout }),
})
```

## Colorful Logs

The colorful logger lives in a separate entrypoint.

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
  logger: pinoLogger(pino, {
    bindings: true,
  }),
})
```

The pino adapter logs `sql`, `bindings`, and `durationMs`; errors also include `err`.

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

Logger errors are caught so logging does not break queries. By default they are reported with `console.error`.

```ts
knexTinyLogger(knex, {
  logger,
  onLoggerError(event) {
    diagnostics.warn(event.error)
  },
})
```

Simple function loggers also work:

```ts
knexTinyLogger(knex, { logger: console.log })
```

## Tracing

Use the tracer directly for lower-level integrations.

```ts
import { createTracer } from 'knex-tiny-logger/tracer'

const tracer = createTracer(knex, {
  onStart(query) {
    span.start(query.sql)
  },
  onEnd(query) {
    span.end({ durationMs: query.durationMs })
  },
  onError(query) {
    span.fail(query.error)
  },
})

tracer.dispose()
```

The tracer is raw on purpose: lifecycle, duration, SQL, bindings, errors. Formatting belongs to loggers.

## License

[MIT](LICENSE.md)
