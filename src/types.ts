import type { Knex } from 'knex'

export type SimpleLogger = (message?: unknown, ...optionalParams: unknown[]) => void

export type MessageWriter = (message: string) => void

export interface MessageWriterTarget {
  write: MessageWriter
}

export type QueryFormatter = (query: QueryFormatterInput) => string

export interface QueryFormatterInput {
  knex: Knex
  sql: string
  bindings: unknown
}

export interface DefaultQueryFormatterOptions {
  bindings?: boolean
}

export interface QueryData {
  __knexQueryUid?: string | number
  sql?: string
  bindings?: unknown
  [key: string]: unknown
}

export interface QueryStartEvent {
  knex: Knex
  queryId: string
  sql: string
  bindings: unknown
  query: QueryData
  startedAt: Date
}

export interface TracerQueryFinishEvent extends QueryStartEvent {
  durationMs: number
}

export interface TracerQueryEndEvent extends TracerQueryFinishEvent {
  response: unknown
}

export interface TracerQueryErrorEvent extends TracerQueryFinishEvent {
  error: unknown
}

export interface LoggerErrorEvent {
  error: unknown
}

export interface TracerErrorEvent {
  error: unknown
}

export interface TracerHooks {
  onStart?: (event: QueryStartEvent) => void
  onEnd?: (event: QueryEndEvent) => void
  onError?: (event: QueryErrorEvent) => void
}

export interface Tracer {
  dispose: () => void
}

export interface QueryFinishEvent extends TracerQueryFinishEvent {}

export interface QueryEndEvent extends QueryFinishEvent {
  response: unknown
}

export interface QueryErrorEvent extends QueryFinishEvent {
  error: unknown
}

export interface Logger extends TracerHooks {}

interface StringLoggerBaseOptions {
  write?: MessageWriter | MessageWriterTarget
}

export type StringLoggerOptions = StringLoggerBaseOptions &
  (
    | {
        bindings?: boolean
        formatter?: undefined
      }
    | {
        bindings?: never
        formatter: QueryFormatter
      }
  )

export type DefaultLoggerOptions = StringLoggerOptions
export type ColorfulLoggerOptions = StringLoggerOptions

export interface CreateTracerOptions extends TracerHooks {
  onTracerError?: (event: TracerErrorEvent) => void
}

export interface KnexTinyLoggerOptions {
  logger?: Logger | SimpleLogger
  onLoggerError?: (event: LoggerErrorEvent) => void
}
