import { ansi } from './ansi.ts'
import { defaultQueryFormatter } from './formatter.ts'
import { resolveMessageWriter } from './message-writer.ts'
import type { ColorfulLoggerOptions, Logger, QueryFormatter } from './types.ts'

const COLORIZE = {
  primary: ansi.magenta,
  error: ansi.red,
  success: ansi.cyan,
}

/**
 * Create the built-in ANSI-colored string logger.
 *
 * It behaves like `defaultLogger`, but colors output by query state.
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
 * import knexTinyLogger from 'knex-tiny-logger'
 * import { colorfulLogger } from 'knex-tiny-logger/colorful'
 *
 * knexTinyLogger(knex, {
 *   logger: colorfulLogger(),
 * })
 * ```
 */
export function colorfulLogger(options: ColorfulLoggerOptions = {}): Logger {
  const write = resolveMessageWriter(options.write)
  const formatter = resolveFormatter(options)

  return {
    onEnd(event) {
      write(`${COLORIZE.primary(`SQL (${event.durationMs.toFixed(3)} ms)`)} ${COLORIZE.success(formatter(event))}`)
    },
    onError(event) {
      write(`${COLORIZE.primary(`SQL (${event.durationMs.toFixed(3)} ms)`)} ${COLORIZE.error(formatter(event))}`)
    },
  }
}

function resolveFormatter(options: ColorfulLoggerOptions): QueryFormatter {
  if (options.formatter) {
    if ('bindings' in options) {
      console.warn('knex-tiny-logger: "bindings" is ignored when "formatter" is provided.')
    }

    return options.formatter
  }

  return defaultQueryFormatter({ bindings: options.bindings })
}
