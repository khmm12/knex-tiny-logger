import type { Logger, QueryEndEvent, QueryErrorEvent } from './types.ts'

export type PinoLogMethod = (object: Record<string, unknown>, message?: string) => void

export interface PinoLikeLogger {
  info: PinoLogMethod
  error: PinoLogMethod
}

export interface PinoLoggerOptions {
  bindings?: boolean
  message?: string
  errorMessage?: string
}

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
