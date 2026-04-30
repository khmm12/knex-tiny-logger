import assert from 'node:assert/strict'
import test from 'node:test'
import createKnex from 'knex'
import knexTinyLogger, { defaultLogger, defaultQueryFormatter } from '../../src/index.ts'
import { createTracer } from '../../src/tracer.ts'
import type { TracerQueryEndEvent, TracerQueryErrorEvent } from '../../src/types.ts'
import { createFakeKnex } from '../helpers/fake-knex.ts'

test('knexTinyLogger returns the knex instance and supports simple function loggers', () => {
  const knex = createFakeKnex()
  const calls: unknown[][] = []
  const result = knexTinyLogger(knex, {
    logger(...args: unknown[]) {
      calls.push(args)
    },
  })

  assert.equal(result, knex)

  knex.emit('query', { __knexQueryUid: 'query-1', sql: 'select ?', bindings: [1] })
  knex.emit('query-response', [], { __knexQueryUid: 'query-1' })

  assert.equal(calls.length, 1)
  assert.match(String(calls[0][0]), /^SQL \(\d+\.\d{3} ms\) select \? -- \[1\]$/)
})

test('defaultQueryFormatter formats bindings through knex 3 raw queries', async () => {
  const knex = createKnex({ client: 'pg' })
  const formatter = defaultQueryFormatter()

  try {
    assert.equal(
      formatter({
        knex,
        sql: 'select ? as id',
        bindings: [1],
      }),
      'select 1 as id',
    )
  } finally {
    await knex.destroy()
  }
})

test('knexTinyLogger logs real knex query responses', async () => {
  const knex = createKnex({
    client: 'sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
  })
  const calls: unknown[][] = []

  try {
    knexTinyLogger(knex, {
      logger(...args: unknown[]) {
        calls.push(args)
      },
    })

    const rows = await knex.raw('select ? as id', [1])

    assert.ok(rows)
    assert.equal(calls.length, 1)
    assert.match(String(calls[0][0]), /^SQL \(\d+\.\d{3} ms\) /)
    assert.match(String(calls[0][0]), /select 1 as id/)
  } finally {
    await knex.destroy()
  }
})

test('knexTinyLogger supports loggers with custom formatters', () => {
  const knex = createFakeKnex()
  const calls: unknown[][] = []

  knexTinyLogger(knex, {
    logger: defaultLogger({
      formatter(event) {
        return `${event.sql} -- custom`
      },
      write(message) {
        calls.push([message])
      },
    }),
  })

  knex.emit('query', { __knexQueryUid: 'query-1', sql: 'select ?', bindings: [1] })
  knex.emit('query-response', [], { __knexQueryUid: 'query-1' })

  assert.match(String(calls[0][0]), /^SQL \(\d+\.\d{3} ms\) select \? -- custom$/)
})

test('knexTinyLogger reports logger errors', () => {
  const knex = createFakeKnex()
  const loggerError = new Error('logger failed')
  const loggerErrors: unknown[] = []

  knexTinyLogger(knex, {
    logger: {
      onEnd() {
        throw loggerError
      },
    },
    onLoggerError(event) {
      loggerErrors.push(event.error)
    },
  })

  knex.emit('query', { __knexQueryUid: 'query-1', sql: 'select ?', bindings: [1] })
  knex.emit('query-response', [], { __knexQueryUid: 'query-1' })

  assert.deepEqual(loggerErrors, [loggerError])
})

test('knexTinyLogger wires start, error, and logger error fallback hooks', () => {
  const knex = createFakeKnex()
  const loggerError = new Error('logger failed')
  const handlerError = new Error('handler failed')
  const startEvents: unknown[] = []
  const consoleErrors: unknown[][] = []
  const originalError = console.error

  console.error = (...args: unknown[]) => {
    consoleErrors.push(args)
  }

  try {
    knexTinyLogger(knex, {
      logger: {
        onStart(event) {
          startEvents.push(event)
        },
        onError() {
          throw loggerError
        },
      },
      onLoggerError() {
        throw handlerError
      },
    })

    knex.emit('query', { __knexQueryUid: 'query-1', sql: 'select broken' })
    knex.emit('query-error', new Error('query failed'), { __knexQueryUid: 'query-1' })
  } finally {
    console.error = originalError
  }

  assert.equal(startEvents.length, 1)
  assert.deepEqual(consoleErrors, [[handlerError]])
})

test('createTracer receives real knex query responses', async () => {
  const knex = createKnex({
    client: 'sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
  })
  const endEvents: TracerQueryEndEvent[] = []
  const tracer = createTracer(knex, {
    onEnd(event) {
      endEvents.push(event)
    },
  })

  try {
    await knex.raw('select ? as id', [1])

    assert.equal(endEvents.length, 1)
    assert.match(endEvents[0].sql, /select \? as id/)
    assert.ok(endEvents[0].durationMs >= 0)
  } finally {
    tracer.dispose()
    await knex.destroy()
  }
})

test('createTracer receives real knex query errors', async () => {
  const knex = createKnex({
    client: 'sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
  })
  const errorEvents: unknown[] = []
  const tracer = createTracer(knex, {
    onError(event) {
      errorEvents.push(event)
    },
  })

  try {
    await assert.rejects(knex.raw('select * from missing_table'))

    assert.equal(errorEvents.length, 1)

    const [event] = errorEvents as TracerQueryErrorEvent[]

    assert.match(event.sql, /missing_table/)
    assert.ok(event.durationMs >= 0)
    assert.ok('error' in event)
  } finally {
    tracer.dispose()
    await knex.destroy()
  }
})
