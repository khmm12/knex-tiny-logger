import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'
import { createQueryEndEvent } from '../test/helpers/events.ts'
import type { Logger } from './types.ts'

const require = createRequire(import.meta.url)
const { resolveLogger } = require('../dist/cjs/resolve-logger.js') as { resolveLogger: (logger: unknown) => Logger }

test('resolveLogger returns the default logger when no logger is provided', () => {
  assert.equal(typeof resolveLogger(undefined).onEnd, 'function')
})

test('resolveLogger keeps object loggers as-is', () => {
  const logger = {
    onEnd() {},
  }

  assert.equal(resolveLogger(logger), logger)
})

test('resolveLogger adapts simple function loggers', () => {
  const calls: unknown[][] = []
  const logger = resolveLogger((...args: unknown[]) => {
    calls.push(args)
  })

  logger.onEnd?.(createQueryEndEvent())

  assert.deepEqual(calls, [['SQL (12.346 ms) select ? -- [1]']])
})
