import type { Knex } from 'knex'
import type {
  DefaultQueryFormatterOptions,
  Logger,
  LoggerErrorEvent,
  MessageWriterTarget,
  QueryFormatter,
  SimpleLogger,
} from 'knex-tiny-logger'
import type { PinoLikeLogger } from 'knex-tiny-logger/pino'
import type { TracerErrorEvent } from 'knex-tiny-logger/tracer'

import knexTinyLogger = require('knex-tiny-logger')
import colorful = require('knex-tiny-logger/colorful')
import pinoFactory = require('pino')
import pinoAdapter = require('knex-tiny-logger/pino')
import tracer = require('knex-tiny-logger/tracer')

const { colorfulLogger } = colorful
const { pinoLogger } = pinoAdapter
const { createTracer } = tracer

declare const knex: Knex
declare const pinoLike: PinoLikeLogger
declare const messageWriterTarget: MessageWriterTarget

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
