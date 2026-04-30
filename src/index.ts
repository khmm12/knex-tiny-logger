import type { Knex } from 'knex'
import { resolveLogger } from './resolve-logger.ts'
import { createTracer } from './tracer.ts'
import type { KnexTinyLoggerOptions } from './types.ts'

export { defaultLogger } from './default-logger.ts'
export { defaultQueryFormatter } from './formatter.ts'
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
} from './types.ts'

/**
 * Attach query logging to a Knex instance and return the same instance.
 *
 * With no options, queries are logged through the built-in dependency-free
 * `defaultLogger()`.
 *
 * Logger errors are caught and reported through `onLoggerError` so logging does
 * not break database queries.
 *
 * @example
 * ```ts
 * import createKnex from 'knex'
 * import knexTinyLogger from 'knex-tiny-logger'
 *
 * const knex = knexTinyLogger(
 *   createKnex({
 *     client: 'pg',
 *     connection: process.env.DATABASE_URL,
 *   }),
 * )
 * ```
 */
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
