import assert from 'node:assert/strict'
import test from 'node:test'
import { createQueryEndEvent } from '../test/helpers/events.ts'
import { resolveLogger } from './resolve-logger.ts'

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
