import type { Knex } from 'knex'
import { resolveLogger } from './resolve-logger.js'
import { createTracer } from './tracer.js'
import type { KnexTinyLoggerOptions } from './types.js'

export { defaultLogger } from './default-logger.js'
export { defaultQueryFormatter } from './formatter.js'
export type {
  DefaultLoggerOptions,
  DefaultQueryFormatterOptions,
  KnexTinyLoggerOptions,
  Logger,
  LoggerErrorEvent,
  MessageWriter,
  MessageWriterTarget,
  QueryData,
  QueryEndEvent,
  QueryErrorEvent,
  QueryFinishEvent,
  QueryFormatter,
  QueryFormatterInput,
  QueryStartEvent,
  SimpleLogger,
  StringLoggerOptions,
} from './types.js'

export default function knexTinyLogger(knex: Knex, options: KnexTinyLoggerOptions = {}): Knex {
  const logger = resolveLogger(options.logger)
  const onLoggerError = options.onLoggerError ?? defaultLoggerErrorHandler

  createTracer(knex, {
    onStart: logger.onStart?.bind(logger),
    onEnd(event) {
      handleLoggerError(() => logger.onEnd?.(event), onLoggerError)
    },
    onError(event) {
      handleLoggerError(() => logger.onError?.(event), onLoggerError)
    },
    onTracerError: onLoggerError,
  })

  return knex
}

function handleLoggerError(handle: () => void, onLoggerError: (event: { error: unknown }) => void): void {
  try {
    handle()
  } catch (error) {
    reportLoggerError(error, onLoggerError)
  }
}

function reportLoggerError(error: unknown, onLoggerError: (event: { error: unknown }) => void): void {
  try {
    onLoggerError({ error })
  } catch (loggerError) {
    defaultLoggerErrorHandler({ error: loggerError })
  }
}

function defaultLoggerErrorHandler({ error }: { error: unknown }): void {
  console.error(error)
}
