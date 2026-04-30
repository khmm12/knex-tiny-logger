import { defaultLogger } from './default-logger.ts'
import type { KnexTinyLoggerOptions, Logger } from './types.ts'

export function resolveLogger(logger: KnexTinyLoggerOptions['logger']): Logger {
  if (!logger) {
    return defaultLogger()
  }

  if (typeof logger === 'function') {
    return defaultLogger({ write: logger })
  }

  return logger
}
