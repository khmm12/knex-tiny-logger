import { resolveMessageWriter } from './message-writer.ts'
import { resolveStringFormatter } from './resolve-formatter.ts'
import type { DefaultLoggerOptions, Logger } from './types.ts'

/**
 * Create the built-in dependency-free string logger.
 *
 * It writes to `console.log` by default.
 *
 * By default, it asks Knex to interpolate bindings into the logged SQL.
 * `bindings: false` writes the original SQL with placeholders.
 *
 * `formatter` lets you replace SQL formatting completely.
 *
 * @example
 * ```ts
 * import knexTinyLogger, { defaultLogger } from 'knex-tiny-logger'
 *
 * knexTinyLogger(knex, {
 *   logger: defaultLogger({ bindings: false }),
 * })
 * ```
 */
export function defaultLogger(options: DefaultLoggerOptions = {}): Logger {
  const write = resolveMessageWriter(options.write)
  const formatter = resolveStringFormatter(options)

  return {
    onEnd(event) {
      write(`SQL (${event.durationMs.toFixed(3)} ms) ${formatter(event)}`)
    },
    onError(event) {
      write(`SQL ERROR (${event.durationMs.toFixed(3)} ms) ${formatter(event)}`)
    },
  }
}
