import type { Logger, QueryEndEvent, QueryErrorEvent } from './types.ts'

/** Log method shape required from a Pino-compatible logger. */
export type PinoLogMethod = (object: Record<string, unknown>, message?: string) => void

/** Minimal Pino-compatible logger accepted by `pinoLogger`. */
export interface PinoLikeLogger {
  info: PinoLogMethod
  error: PinoLogMethod
}

/** Options for `pinoLogger`. */
export interface PinoLoggerOptions {
  /** Include Knex bindings in structured log fields. Defaults to `true`. */
  bindings?: boolean
  /** Message used for successful queries. Defaults to `"SQL query"`. */
  message?: string
  /** Message used for failed queries. Defaults to `"SQL query failed"`. */
  errorMessage?: string
}

/**
 * Create a structured logger adapter for Pino-compatible loggers.
 *
 * Successful queries are logged with `info`; failed queries are logged with
 * `error`. Log objects include `sql`, `durationMs`, and `bindings` by default.
 * Failed queries also include `err`.
 *
 * @example
 * ```ts
 * import knexTinyLogger from 'knex-tiny-logger'
 * import { pinoLogger } from 'knex-tiny-logger/pino'
 *
 * knexTinyLogger(knex, {
 *   logger: pinoLogger(pino, { bindings: true }),
 * })
 * ```
 */
export function pinoLogger(pino: PinoLikeLogger, options: PinoLoggerOptions = {}): Logger {
  const { bindings = true, message = 'SQL query', errorMessage = 'SQL query failed' } = options

  return {
    onEnd(event) {
      pino.info(createQueryPayload(event, { bindings }), message)
    },
    onError(event) {
      pino.error({ ...createQueryPayload(event, { bindings }), err: event.error }, errorMessage)
    },
  }
}

function createQueryPayload(
  event: QueryEndEvent | QueryErrorEvent,
  options: {
    bindings: boolean
  },
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    sql: event.sql,
    durationMs: event.durationMs,
  }

  if (options.bindings) {
    payload.bindings = event.bindings
  }

  return payload
}
