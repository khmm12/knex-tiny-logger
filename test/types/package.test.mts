import type { Knex } from 'knex'
import knexTinyLogger, {
  type DefaultQueryFormatterOptions,
  defaultLogger,
  defaultQueryFormatter,
  type KnexTinyLoggerOptions,
  type Logger,
  type LoggerErrorEvent,
  type MessageWriter,
  type MessageWriterTarget,
  type QueryEndEvent,
  type QueryErrorEvent,
  type QueryFormatter,
  type QueryStartEvent,
  type SimpleLogger,
  type StringLoggerOptions,
} from 'knex-tiny-logger'
import { colorfulLogger } from 'knex-tiny-logger/colorful'
import type { PinoLikeLogger, PinoLoggerOptions } from 'knex-tiny-logger/pino'
import { pinoLogger } from 'knex-tiny-logger/pino'
import type { TracerErrorEvent, TracerQueryEndEvent } from 'knex-tiny-logger/tracer'
import { createTracer } from 'knex-tiny-logger/tracer'
import pinoFactory from 'pino'

declare const knex: Knex

const simpleLogger: SimpleLogger = (message?: unknown, ...optionalParams: unknown[]) => {
  void message
  void optionalParams
}

const messageWriter: MessageWriter = (message) => {
  message satisfies string
}

const messageWriterTarget: MessageWriterTarget = {
  write(message) {
    message satisfies string
  },
}

const logger: Logger = {
  onStart(event: QueryStartEvent) {
    event.queryId satisfies string
  },
  onEnd(event: QueryEndEvent) {
    event.durationMs satisfies number
    event.response satisfies unknown
  },
  onError(event: QueryErrorEvent) {
    event.error satisfies unknown
  },
}

const options: KnexTinyLoggerOptions = {
  logger,
  onLoggerError(event: LoggerErrorEvent) {
    event.error satisfies unknown
  },
}

const formatterOptions: DefaultQueryFormatterOptions = {
  bindings: true,
}

const loggerOptions: StringLoggerOptions = {
  bindings: false,
}

const pinoLike: PinoLikeLogger = {
  info(object, message) {
    object satisfies Record<string, unknown>
    message satisfies string | undefined
  },
  error(object, message) {
    object satisfies Record<string, unknown>
    message satisfies string | undefined
  },
}

const pinoOptions: PinoLoggerOptions = {
  bindings: false,
  message: 'SQL query',
  errorMessage: 'SQL query failed',
}

// Root API
knexTinyLogger(knex)
knexTinyLogger(knex, options) satisfies Knex
knexTinyLogger(knex, { logger: simpleLogger }) satisfies Knex

const _invalidOptionsWithBindings: KnexTinyLoggerOptions = {
  // @ts-expect-error bindings belongs to string logger options, not knexTinyLogger options.
  bindings: true,
}

const _invalidOptionsWithFormatter: KnexTinyLoggerOptions = {
  // @ts-expect-error formatter belongs to string logger options, not knexTinyLogger options.
  formatter: ((event) => event.sql) satisfies QueryFormatter,
}

const _invalidLogger: Logger = {
  // @ts-expect-error Logger callbacks receive public event objects, not arbitrary narrower shapes.
  onEnd(event: { nope: string }) {
    void event
  },
}

const _invalidLoggerErrorHook: Logger = {
  // @ts-expect-error Logger errors are configured through options, not Logger.
  onLoggerError(event: LoggerErrorEvent) {
    void event
  },
}

// @ts-expect-error SimpleLogger must accept any message shape.
const _invalidSimpleLogger: SimpleLogger = (message: string) => {
  void message
}

// @ts-expect-error Tracer is available only from the tracer subpath.
const _rootCreateTracer = knexTinyLogger.createTracer

// String loggers
defaultLogger() satisfies Logger
defaultLogger({ write: simpleLogger }) satisfies Logger
defaultLogger({ write: messageWriter }) satisfies Logger
defaultLogger({ write: messageWriterTarget }) satisfies Logger
defaultLogger(loggerOptions) satisfies Logger
defaultLogger({
  formatter(event) {
    event.bindings satisfies unknown

    return event.sql
  },
}) satisfies Logger
colorfulLogger() satisfies Logger
colorfulLogger({ write: simpleLogger }) satisfies Logger
colorfulLogger({ write: messageWriterTarget }) satisfies Logger

// @ts-expect-error bindings belongs only to the default string formatter path.
const _invalidLoggerOptions: StringLoggerOptions = {
  bindings: true,
  formatter: ((event) => event.sql) satisfies QueryFormatter,
}

// Formatter
defaultQueryFormatter(formatterOptions)({
  knex,
  sql: 'select ?',
  bindings: [1],
}) satisfies string

// Tracer
createTracer(knex, logger).dispose()
createTracer(knex, {
  onEnd(event: TracerQueryEndEvent) {
    // @ts-expect-error Tracer events are raw and do not format SQL.
    event.formattedSql satisfies string
  },
  onTracerError(event: TracerErrorEvent) {
    event.error satisfies unknown
  },
}).dispose()

createTracer(knex, {
  // @ts-expect-error Logger error naming belongs to knexTinyLogger options, not createTracer options.
  onLoggerError(event: LoggerErrorEvent) {
    void event
  },
})

// Pino adapter
pinoLogger(pinoLike) satisfies Logger
pinoLogger(pinoLike, pinoOptions) satisfies Logger
pinoLogger(pinoFactory()) satisfies Logger
