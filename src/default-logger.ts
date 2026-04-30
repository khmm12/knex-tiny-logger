import { defaultQueryFormatter } from './formatter.js'
import { resolveMessageWriter } from './message-writer.js'
import type { DefaultLoggerOptions, Logger, QueryFormatter } from './types.js'

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
