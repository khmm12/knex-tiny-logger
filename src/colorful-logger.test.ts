import assert from 'node:assert/strict'
import test from 'node:test'
import { createQueryEndEvent, createQueryErrorEvent } from '../test/helpers/events.ts'
import { colorfulLogger } from './colorful-logger.ts'

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
