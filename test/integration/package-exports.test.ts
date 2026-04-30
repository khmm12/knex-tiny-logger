import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
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

test('exports a callable commonjs entrypoint with named helpers', () => {
  const require = createRequire(import.meta.url)
  const cjs = require('../../dist/cjs/index.cjs')

  assert.equal(typeof cjs, 'function')
  assert.equal(cjs.default, cjs)
  assert.equal(cjs.createTracer, undefined)
  assert.equal(typeof cjs.defaultLogger, 'function')
  assert.equal(typeof cjs.defaultLogger().onEnd, 'function')
})

test('exports colorful loggers from a separate entrypoint', () => {
  const require = createRequire(import.meta.url)
  const cjs = require('../../dist/cjs/colorful.js')

  assert.equal(typeof colorfulLogger, 'function')
  assert.equal(typeof colorfulLogger().onEnd, 'function')
  assert.equal(typeof cjs.colorfulLogger, 'function')
  assert.equal(typeof cjs.colorfulLogger().onEnd, 'function')
})

test('exports pino loggers from a separate entrypoint', () => {
  const require = createRequire(import.meta.url)
  const cjs = require('../../dist/cjs/pino.js')
  const pino = {
    info() {},
    error() {},
  }

  assert.equal(typeof pinoLogger, 'function')
  assert.equal(typeof pinoLogger(pino).onEnd, 'function')
  assert.equal(typeof cjs.pinoLogger, 'function')
  assert.equal(typeof cjs.pinoLogger(pino).onEnd, 'function')
})

test('exports tracer from a separate entrypoint', () => {
  const require = createRequire(import.meta.url)
  const cjs = require('../../dist/cjs/tracer.js')

  assert.equal(typeof createTracer, 'function')
  assert.equal(typeof cjs.createTracer, 'function')
})
