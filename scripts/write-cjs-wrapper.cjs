const fs = require('node:fs')
const path = require('node:path')

const cjsDir = path.join(__dirname, '..', 'dist', 'cjs')
const typesDir = path.join(__dirname, '..', 'dist', 'types')

fs.mkdirSync(cjsDir, { recursive: true })
fs.mkdirSync(typesDir, { recursive: true })
fs.writeFileSync(path.join(cjsDir, 'package.json'), '{"type":"commonjs"}\n')
fs.writeFileSync(
  path.join(cjsDir, 'index.cjs'),
  `'use strict'

const mod = require('./index.js')
const knexTinyLogger = mod.default

module.exports = knexTinyLogger
Object.assign(module.exports, mod, { default: knexTinyLogger })
`,
)
fs.writeFileSync(
  path.join(typesDir, 'index.d.cts'),
  `import type { Knex } from 'knex'
import type {
  DefaultLoggerOptions,
  DefaultQueryFormatterOptions,
  KnexTinyLoggerOptions,
  Logger,
  LoggerErrorEvent,
  MessageWriter,
  MessageWriterTarget,
  QueryData,
  QueryEndEvent,
  QueryErrorEvent,
  QueryFinishEvent,
  QueryFormatter,
  QueryFormatterInput,
  QueryStartEvent,
  SimpleLogger,
  StringLoggerOptions,
} from './types.js'

declare function knexTinyLogger(knex: Knex, options?: KnexTinyLoggerOptions): Knex

declare namespace knexTinyLogger {
  export { knexTinyLogger as default }
  export const defaultLogger: typeof import('./default-logger.js').defaultLogger
  export const defaultQueryFormatter: typeof import('./formatter.js').defaultQueryFormatter
  export type {
    DefaultLoggerOptions,
    DefaultQueryFormatterOptions,
    KnexTinyLoggerOptions,
    Logger,
    LoggerErrorEvent,
    MessageWriter,
    MessageWriterTarget,
    QueryData,
    QueryEndEvent,
    QueryErrorEvent,
    QueryFinishEvent,
    QueryFormatter,
    QueryFormatterInput,
    QueryStartEvent,
    SimpleLogger,
    StringLoggerOptions,
  }
}

export = knexTinyLogger
`,
)
