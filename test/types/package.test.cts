import type { Knex } from 'knex'
import type {
  DefaultQueryFormatterOptions,
  Logger,
  LoggerErrorEvent,
  MessageWriterTarget,
  QueryFormatter,
  SimpleLogger,
} from 'knex-tiny-logger'
import type {
  ColorfulLoggerOptions,
  ColorfulSyntaxColor,
  ColorfulSyntaxTheme,
  ColorfulSyntaxThemeInput,
} from 'knex-tiny-logger/colorful'
import type { PinoLikeLogger } from 'knex-tiny-logger/pino'
import type { TracerErrorEvent } from 'knex-tiny-logger/tracer'

import knexTinyLogger = require('knex-tiny-logger')
import colorful = require('knex-tiny-logger/colorful')
import pinoFactory = require('pino')
import pinoAdapter = require('knex-tiny-logger/pino')
import tracer = require('knex-tiny-logger/tracer')

const { colorfulLogger, colorfulSyntaxFormatter, colorfulSyntaxThemes, colorizeSql } = colorful
const { pinoLogger } = pinoAdapter
const { createTracer } = tracer

declare const knex: Knex
declare const pinoLike: PinoLikeLogger
declare const messageWriterTarget: MessageWriterTarget

const syntaxColor: ColorfulSyntaxColor = false
const syntaxThemeInput: ColorfulSyntaxThemeInput = {
  keyword: '\x1b[35m',
  fn: syntaxColor,
}
const syntaxTheme: ColorfulSyntaxTheme = colorfulSyntaxThemes.dracula.extend(syntaxThemeInput).extend({
  keyword: false,
})

// Root API
knexTinyLogger(knex) satisfies Knex
knexTinyLogger(knex, {
  logger: ((message?: unknown) => void message) satisfies SimpleLogger,
  onLoggerError(event: LoggerErrorEvent) {
    event.error satisfies unknown
  },
})

// @ts-expect-error Tracer is available only from the tracer subpath.
knexTinyLogger.createTracer

// String loggers
knexTinyLogger.defaultLogger() satisfies Logger
knexTinyLogger.defaultLogger({ write: messageWriterTarget }) satisfies Logger
colorfulLogger() satisfies Logger
colorfulLogger({ highlight: true }) satisfies Logger
colorfulLogger({
  highlight: true,
  theme: syntaxTheme,
} satisfies ColorfulLoggerOptions) satisfies Logger

// @ts-expect-error `theme` applies only in highlight mode.
colorfulLogger({ theme: syntaxTheme })

colorfulLogger({
  // @ts-expect-error the theme option takes objects, not theme names.
  theme: 'light',
})

colorfulLogger({
  // @ts-expect-error the theme option takes objects, not a separate colors option.
  colors: {
    keyword: '\x1b[35m',
  },
})

colorfulLogger({
  theme: {
    // @ts-expect-error use `fn` for SQL functions.
    function: '\x1b[31m',
  },
})

colorizeSql('select 1', { theme: syntaxTheme }) satisfies string
colorfulSyntaxFormatter(knexTinyLogger.defaultQueryFormatter(), {
  theme: colorfulSyntaxThemes.solarizedLight.extend({ fn: false }),
}) satisfies QueryFormatter

// Formatter
knexTinyLogger.defaultQueryFormatter({
  bindings: false,
} satisfies DefaultQueryFormatterOptions) satisfies QueryFormatter

// Pino adapter
pinoLogger(pinoLike) satisfies Logger
pinoLogger(pinoFactory()) satisfies Logger

// Tracer
createTracer(knex, {
  onTracerError(event: TracerErrorEvent) {
    event.error satisfies unknown
  },
}).dispose()
