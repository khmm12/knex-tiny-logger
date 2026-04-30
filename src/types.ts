import type { Knex } from 'knex'

/** Function logger adapter, for example `console.log`. */
export type SimpleLogger = (message?: unknown, ...optionalParams: unknown[]) => void

/** Receives one complete message from a string logger. */
export type MessageWriter = (message: string) => void

/** Stream-like writer target accepted by string loggers, for example `process.stdout`. */
export interface MessageWriterTarget {
  write: MessageWriter
}

/** Converts query data into the SQL text written by string loggers. */
export type QueryFormatter = (query: QueryFormatterInput) => string

/** Data available to custom query formatters. */
export interface QueryFormatterInput {
  knex: Knex
  sql: string
  bindings: unknown
}

/** Options for `defaultQueryFormatter`. */
export interface DefaultQueryFormatterOptions {
  /** Include bindings in formatted SQL when Knex can interpolate them. Defaults to `true`. */
  bindings?: boolean
}

/** Raw query object received from Knex events. */
export interface QueryData {
  __knexQueryUid?: string | number
  sql?: string
  bindings?: unknown
  [key: string]: unknown
}

/** Query lifecycle event emitted when Knex starts a query. */
export interface QueryStartEvent {
  knex: Knex
  queryId: string
  sql: string
  bindings: unknown
  query: QueryData
  startedAt: Date
}

/** Base event for finished queries. */
export interface TracerQueryFinishEvent extends QueryStartEvent {
  durationMs: number
}

/** Tracer event for successful queries. */
export interface TracerQueryEndEvent extends TracerQueryFinishEvent {
  response: unknown
}

/** Tracer event for failed queries. */
export interface TracerQueryErrorEvent extends TracerQueryFinishEvent {
  error: unknown
}

/** Error reported when a logger hook, writer, or formatter throws. */
export interface LoggerErrorEvent {
  error: unknown
}

/** Error reported when a tracer hook throws. */
export interface TracerErrorEvent {
  error: unknown
}

/** Optional hooks for query lifecycle events. */
export interface TracerHooks {
  /** Called when Knex starts a query. */
  onStart?: (event: QueryStartEvent) => void
  /** Called when Knex completes a query successfully. */
  onEnd?: (event: QueryEndEvent) => void
  /** Called when Knex reports a query error. */
  onError?: (event: QueryErrorEvent) => void
}

/** Active tracer subscription returned by `createTracer`. */
export interface Tracer {
  /** Remove all Knex event listeners installed by the tracer. */
  dispose: () => void
}

/** Base logger event for finished queries. */
export interface QueryFinishEvent extends TracerQueryFinishEvent {}

/** Logger event for successful queries. */
export interface QueryEndEvent extends QueryFinishEvent {
  response: unknown
}

/** Logger event for failed queries. */
export interface QueryErrorEvent extends QueryFinishEvent {
  error: unknown
}

/** Lifecycle logger consumed by `knexTinyLogger`. */
export interface Logger extends TracerHooks {}

interface StringLoggerBaseOptions {
  /** Writer function or stream-like target. Defaults to `console.log`. */
  write?: MessageWriter | MessageWriterTarget
}

/**
 * Options shared by string loggers.
 *
 * `bindings` configures the built-in formatter. `formatter` provides custom
 * SQL formatting, so `bindings` only applies when `formatter` is not provided.
 */
export type StringLoggerOptions = StringLoggerBaseOptions &
  (
    | {
        /** Include bindings in SQL formatted by the built-in formatter. Defaults to `true`. */
        bindings?: boolean
        formatter?: undefined
      }
    | {
        bindings?: never
        /** Custom SQL formatter. */
        formatter: QueryFormatter
      }
  )

/** Options accepted by `defaultLogger`. */
export type DefaultLoggerOptions = StringLoggerOptions
/** Options accepted by `colorfulLogger`. */
export type ColorfulLoggerOptions = StringLoggerOptions

/** Options for `createTracer`. */
export interface CreateTracerOptions extends TracerHooks {
  /** Called when a tracer hook throws. Defaults to a no-op. */
  onTracerError?: (event: TracerErrorEvent) => void
}

/** Options for `knexTinyLogger`. */
export interface KnexTinyLoggerOptions {
  /** Logger implementation or simple log function. Defaults to `defaultLogger()`. */
  logger?: Logger | SimpleLogger
  /** Called when a logger hook, writer, or formatter throws. Defaults to `console.error`. */
  onLoggerError?: (event: LoggerErrorEvent) => void
}
