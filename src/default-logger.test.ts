import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultLogger } from 'knex-tiny-logger'
import { createQueryEndEvent, createQueryErrorEvent } from '../test/helpers/events.ts'
import type { QueryFormatterInput } from './types.ts'

test('defaultLogger writes successful queries without colors', () => {
  const calls: string[] = []
  const logger = defaultLogger({
    write(message) {
      calls.push(message)
    },
  })

  logger.onEnd?.(createQueryEndEvent())

  assert.deepEqual(calls, ['SQL (12.346 ms) select ? -- [1]'])
})

test('defaultLogger writes failed queries without colors', () => {
  const calls: string[] = []
  const logger = defaultLogger({
    write(message) {
      calls.push(message)
    },
  })

  logger.onError?.(createQueryErrorEvent({ sql: 'select broken', bindings: [] }))

  assert.deepEqual(calls, ['SQL ERROR (12.346 ms) select broken'])
})

test('defaultLogger supports custom formatters', () => {
  const calls: string[] = []
  const logger = defaultLogger({
    formatter(event) {
      return `${event.sql} -- custom`
    },
    write(message) {
      calls.push(message)
    },
  })

  logger.onEnd?.(createQueryEndEvent())

  assert.deepEqual(calls, ['SQL (12.346 ms) select ? -- custom'])
})

test('defaultLogger supports stream-like writers', () => {
  const calls: string[] = []
  const logger = defaultLogger({
    write: {
      write(message) {
        calls.push(message)
      },
    },
  })

  logger.onEnd?.(createQueryEndEvent())

  assert.deepEqual(calls, ['SQL (12.346 ms) select ? -- [1]'])
})

test('defaultLogger warns when bindings and formatter are provided together', () => {
  const warnings: unknown[][] = []
  const originalWarn = console.warn

  console.warn = (...args: unknown[]) => {
    warnings.push(args)
  }

  try {
    defaultLogger({
      bindings: false,
      formatter(event: QueryFormatterInput) {
        return event.sql
      },
    } as unknown as Parameters<typeof defaultLogger>[0])
  } finally {
    console.warn = originalWarn
  }

  assert.deepEqual(warnings, [['knex-tiny-logger: "bindings" is ignored when "formatter" is provided.']])
})
