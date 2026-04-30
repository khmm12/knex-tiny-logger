import assert from 'node:assert/strict'
import { Writable } from 'node:stream'
import test from 'node:test'
import pino from 'pino'
import { createQueryEndEvent, createQueryErrorEvent } from '../test/helpers/events.ts'
import { pinoLogger } from './pino-logger.ts'

test('pinoLogger writes successful queries with info', () => {
  const calls: unknown[][] = []
  const logger = pinoLogger({
    info(...args: unknown[]) {
      calls.push(args)
    },
    error(...args: unknown[]) {
      calls.push(args)
    },
  })

  logger.onEnd?.(createQueryEndEvent())

  assert.deepEqual(calls, [
    [
      {
        sql: 'select ?',
        bindings: [1],
        durationMs: 12.34567,
      },
      'SQL query',
    ],
  ])
})

test('pinoLogger writes failed queries with error', () => {
  const calls: unknown[][] = []
  const error = new Error('boom')
  const logger = pinoLogger(
    {
      info(...args: unknown[]) {
        calls.push(args)
      },
      error(...args: unknown[]) {
        calls.push(args)
      },
    },
    {
      errorMessage: 'Database query failed',
    },
  )

  logger.onError?.(createQueryErrorEvent({ error }))

  assert.deepEqual(calls, [
    [
      {
        sql: 'select ?',
        bindings: [1],
        durationMs: 12.34567,
        err: error,
      },
      'Database query failed',
    ],
  ])
})

test('pinoLogger can omit bindings', () => {
  const calls: unknown[][] = []
  const logger = pinoLogger(
    {
      info(...args: unknown[]) {
        calls.push(args)
      },
      error(...args: unknown[]) {
        calls.push(args)
      },
    },
    {
      bindings: false,
    },
  )

  logger.onEnd?.(createQueryEndEvent())

  assert.deepEqual(calls, [
    [
      {
        sql: 'select ?',
        durationMs: 12.34567,
      },
      'SQL query',
    ],
  ])
})

test('pinoLogger writes structured entries with real pino', () => {
  const chunks: string[] = []
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(String(chunk))
      callback()
    },
  })
  const logger = pinoLogger(pino({ base: undefined, timestamp: false }, stream))

  logger.onEnd?.(createQueryEndEvent())

  assert.equal(chunks.length, 1)
  assert.deepEqual(JSON.parse(chunks[0]), {
    level: 30,
    sql: 'select ?',
    bindings: [1],
    durationMs: 12.34567,
    msg: 'SQL query',
  })
})
