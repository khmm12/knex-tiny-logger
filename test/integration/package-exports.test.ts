import assert from 'node:assert/strict'
import test from 'node:test'
import knexTinyLogger, { defaultLogger, defaultQueryFormatter } from 'knex-tiny-logger'
import { colorfulLogger } from 'knex-tiny-logger/colorful'
import { pinoLogger } from 'knex-tiny-logger/pino'
import { createTracer } from 'knex-tiny-logger/tracer'

test('exports an esm default logger plugin', () => {
  assert.equal(typeof knexTinyLogger, 'function')
  assert.equal(typeof defaultLogger, 'function')
  assert.equal(typeof defaultLogger().onEnd, 'function')
  assert.equal(typeof defaultQueryFormatter, 'function')
})

test('exports colorful loggers from a separate esm entrypoint', () => {
  assert.equal(typeof colorfulLogger, 'function')
  assert.equal(typeof colorfulLogger().onEnd, 'function')
})

test('exports pino loggers from a separate esm entrypoint', () => {
  const pino = {
    info() {},
    error() {},
  }

  assert.equal(typeof pinoLogger, 'function')
  assert.equal(typeof pinoLogger(pino).onEnd, 'function')
})

test('exports tracer from a separate esm entrypoint', () => {
  assert.equal(typeof createTracer, 'function')
})
