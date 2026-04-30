import assert from 'node:assert/strict'
import test from 'node:test'
import { createQueryEndEvent, createQueryErrorEvent } from '../test/helpers/events.ts'
import { colorfulLogger } from './colorful-logger.ts'
import type { QueryFormatterInput } from './types.ts'

test('colorfulLogger writes successful queries', () => {
  const calls: string[] = []
  const logger = colorfulLogger({
    write(message) {
      calls.push(message)
    },
  })

  logger.onEnd?.(createQueryEndEvent())

  assert.equal(calls.length, 1)
  assert.match(calls[0], /SQL \(12\.346 ms\)/)
  assert.match(calls[0], /select \? -- \[1\]/)
  assert.equal(calls[0]?.includes('\u001B[35m'), true)
  assert.equal(calls[0]?.includes('\u001B[36m'), true)
})

test('colorfulLogger writes failed queries', () => {
  const calls: string[] = []
  const logger = colorfulLogger({
    write(message) {
      calls.push(message)
    },
  })

  logger.onError?.(createQueryErrorEvent({ sql: 'select broken', bindings: [] }))

  assert.equal(calls.length, 1)
  assert.match(calls[0], /SQL \(12\.346 ms\)/)
  assert.match(calls[0], /select broken/)
  assert.equal(calls[0]?.includes('\u001B[35m'), true)
  assert.equal(calls[0]?.includes('\u001B[31m'), true)
})

test('colorfulLogger supports custom formatters', () => {
  const calls: string[] = []
  const logger = colorfulLogger({
    formatter(event) {
      return `${event.sql} -- custom`
    },
    write(message) {
      calls.push(message)
    },
  })

  logger.onEnd?.(createQueryEndEvent())

  assert.equal(calls.length, 1)
  assert.match(calls[0], /select \? -- custom/)
})

test('colorfulLogger warns when bindings and formatter are provided together', () => {
  const warnings: unknown[][] = []
  const originalWarn = console.warn

  console.warn = (...args: unknown[]) => {
    warnings.push(args)
  }

  try {
    colorfulLogger({
      bindings: false,
      formatter(event: QueryFormatterInput) {
        return event.sql
      },
    } as unknown as Parameters<typeof colorfulLogger>[0])
  } finally {
    console.warn = originalWarn
  }

  assert.deepEqual(warnings, [['knex-tiny-logger: "bindings" is ignored when "formatter" is provided.']])
})
