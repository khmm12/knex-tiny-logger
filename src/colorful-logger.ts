import { ansi } from './ansi.ts'
import type { ColorfulSyntaxThemeInput } from './colorful-syntax.ts'
import { colorfulSyntaxFormatter } from './colorful-syntax.ts'
import { resolveMessageWriter } from './message-writer.ts'
import { resolveStringFormatter } from './resolve-formatter.ts'
import type { Logger, QueryFormatter, StringLoggerOptions } from './types.ts'

/**
 * Options accepted by `colorfulLogger`.
 *
 * Same formatting options as `defaultLogger`, plus optional syntax highlighting.
 */
export type ColorfulLoggerOptions = StringLoggerOptions &
  (
    | {
        /**
         * Syntax-highlight the SQL body instead of tinting the whole line by state.
         *
         * Defaults to `false`.
         */
        highlight?: false
        theme?: never
      }
    | {
        highlight: true
        /**
         * SQL syntax color theme. Applies only in highlight mode.
         *
         * Defaults to `colorfulSyntaxThemes.default`.
         */
        theme?: ColorfulSyntaxThemeInput
      }
  )

/**
 * Create the built-in ANSI-colored string logger.
 *
 * It behaves like `defaultLogger`, but colors output by query state: the
 * `SQL` / `SQL ERROR` label is cyan for successful queries and red for failed
 * ones. By default the SQL body shares that state color.
 *
 * Set `highlight: true` to syntax-highlight the SQL body instead; the label
 * keeps carrying the query state. Pass `theme` to pick the syntax colors.
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
 * import { colorfulLogger, colorfulSyntaxThemes } from 'knex-tiny-logger/colorful'
 *
 * knexTinyLogger(knex, {
 *   logger: colorfulLogger(),
 * })
 *
 * knexTinyLogger(knex, {
 *   logger: colorfulLogger({ highlight: true, theme: colorfulSyntaxThemes.dracula }),
 * })
 * ```
 */
export function colorfulLogger(options: ColorfulLoggerOptions = {}): Logger {
  const write = resolveMessageWriter(options.write)
  const format = resolveStringFormatter(options)
  const renderBody = resolveBodyRenderer(options, format)

  return {
    onEnd(event) {
      write(`${ansi.cyan(`SQL (${event.durationMs.toFixed(3)} ms)`)} ${renderBody.success(event)}`)
    },
    onError(event) {
      write(`${ansi.red(`SQL ERROR (${event.durationMs.toFixed(3)} ms)`)} ${renderBody.error(event)}`)
    },
  }
}

interface BodyRenderer {
  success: QueryFormatter
  error: QueryFormatter
}

function resolveBodyRenderer(options: ColorfulLoggerOptions, format: QueryFormatter): BodyRenderer {
  if (options.highlight) {
    const highlight = colorfulSyntaxFormatter(format, { theme: options.theme })
    return { success: highlight, error: highlight }
  }

  if (options.theme != null) {
    console.warn('knex-tiny-logger: "theme" is ignored unless "highlight" is enabled.')
  }

  return {
    success: (event) => ansi.cyan(format(event)),
    error: (event) => ansi.red(format(event)),
  }
}
