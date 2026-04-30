import { ansi } from './ansi.js'
import { defaultQueryFormatter } from './formatter.js'
import { resolveMessageWriter } from './message-writer.js'
import type { ColorfulLoggerOptions, Logger, QueryFormatter } from './types.js'

const COLORIZE = {
  primary: ansi.magenta,
  error: ansi.red,
  success: ansi.cyan,
}

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
