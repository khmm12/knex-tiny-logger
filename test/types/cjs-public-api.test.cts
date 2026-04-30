import type { Knex } from 'knex'
import type {
  DefaultQueryFormatterOptions,
  Logger,
  LoggerErrorEvent,
  MessageWriterTarget,
  SimpleLogger,
} from 'knex-tiny-logger'
import type { PinoLikeLogger } from 'knex-tiny-logger/pino'
import type { TracerErrorEvent } from 'knex-tiny-logger/tracer'

import knexTinyLogger = require('knex-tiny-logger')
import colorful = require('knex-tiny-logger/colorful')
import pinoAdapter = require('knex-tiny-logger/pino')
import tracer = require('knex-tiny-logger/tracer')

const { colorfulLogger } = colorful
const { pinoLogger } = pinoAdapter
const { createTracer } = tracer

declare const knex: Knex
declare const pino: PinoLikeLogger
declare const messageWriterTarget: MessageWriterTarget

knexTinyLogger(knex) satisfies Knex
knexTinyLogger.default(knex) satisfies Knex
knexTinyLogger.defaultLogger() satisfies Logger
knexTinyLogger.defaultLogger({ write: messageWriterTarget }) satisfies Logger
knexTinyLogger.defaultQueryFormatter({ bindings: false } satisfies DefaultQueryFormatterOptions) satisfies Function
// @ts-expect-error Tracer is available only from the tracer subpath.
knexTinyLogger.createTracer
knexTinyLogger(knex, {
  logger: ((message?: unknown) => void message) satisfies SimpleLogger,
  onLoggerError(event: LoggerErrorEvent) {
    event.error satisfies unknown
  },
})
colorfulLogger() satisfies Logger
pinoLogger(pino) satisfies Logger
createTracer(knex, {
  onTracerError(event: TracerErrorEvent) {
    event.error satisfies unknown
  },
}).dispose()
