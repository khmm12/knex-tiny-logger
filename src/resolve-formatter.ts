import { defaultQueryFormatter } from './formatter.ts'
import type { QueryFormatter, StringLoggerOptions } from './types.ts'

/**
 * Resolve the SQL formatter for a string logger.
 *
 * A custom `formatter` wins and makes `bindings` irrelevant, so passing both
 * warns. Otherwise the built-in formatter is used with the requested
 * `bindings` behavior.
 */
export function resolveStringFormatter(options: StringLoggerOptions): QueryFormatter {
  if (options.formatter) {
    if ('bindings' in options) {
      console.warn('knex-tiny-logger: "bindings" is ignored when "formatter" is provided.')
    }

    return options.formatter
  }

  return defaultQueryFormatter({ bindings: options.bindings })
}
