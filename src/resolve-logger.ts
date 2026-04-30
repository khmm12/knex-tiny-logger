import { defaultLogger } from './default-logger.js'
import type { KnexTinyLoggerOptions, Logger } from './types.js'

export function resolveLogger(logger: KnexTinyLoggerOptions['logger']): Logger {
  if (!logger) {
    return defaultLogger()
  }

  if (typeof logger === 'function') {
    return defaultLogger({ write: logger })
  }

  return logger
}
