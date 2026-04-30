import { defaultQueryFormatter } from './formatter.ts'
import { resolveMessageWriter } from './message-writer.ts'
import type { DefaultLoggerOptions, Logger, QueryFormatter } from './types.ts'

/**
 * Create the built-in dependency-free string logger.
 *
 * It writes to `console.log` by default. `bindings` configures the built-in
 * formatter; `formatter` lets you provide custom SQL formatting.
 *
 * @example
 * ```ts
 * import knexTinyLogger, { defaultLogger } from 'knex-tiny-logger'
 *
 * knexTinyLogger(knex, { logger: defaultLogger({ bindings: false }) })
 * ```
 */
export function defaultLogger(options: DefaultLoggerOptions = {}): Logger {
  const write = resolveMessageWriter(options.write)
  const formatter = resolveFormatter(options)

  return {
    onEnd(event) {
      write(`SQL (${event.durationMs.toFixed(3)} ms) ${formatter(event)}`)
    },
    onError(event) {
      write(`SQL ERROR (${event.durationMs.toFixed(3)} ms) ${formatter(event)}`)
    },
  }
}

function resolveFormatter(options: DefaultLoggerOptions): QueryFormatter {
  if (options.formatter) {
    if ('bindings' in options) {
      console.warn('knex-tiny-logger: "bindings" is ignored when "formatter" is provided.')
    }

    return options.formatter
  }

  return defaultQueryFormatter({ bindings: options.bindings })
}
