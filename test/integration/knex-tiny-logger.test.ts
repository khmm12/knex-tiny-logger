import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Knex } from 'knex'
import createKnex from 'knex'
import knexTinyLogger, { defaultQueryFormatter } from '../../src/index.ts'
import { createTracer } from '../../src/tracer.ts'
import type { TracerQueryEndEvent, TracerQueryErrorEvent } from '../../src/types.ts'

describe('knexTinyLogger', () => {
  it('returns the knex instance', async () => {
    const knex = createSqliteKnex()

    try {
      assert.equal(knexTinyLogger(knex), knex)
    } finally {
      await knex.destroy()
    }
  })

  it('logs real knex query responses', async () => {
    const knex = createSqliteKnex()
    const calls: unknown[][] = []

    try {
      knexTinyLogger(knex, {
        logger(...args: unknown[]) {
          calls.push(args)
        },
      })

      await knex.raw('select ? as id', [1])

      assert.equal(calls.length, 1)
      assert.match(String(calls[0][0]), /^SQL \(\d+\.\d{3} ms\) /)
      assert.match(String(calls[0][0]), /select 1 as id/)
    } finally {
      await knex.destroy()
    }
  })

  it('logs real knex query errors', async () => {
    const knex = createSqliteKnex()
    const calls: unknown[][] = []

    try {
      knexTinyLogger(knex, {
        logger(...args: unknown[]) {
          calls.push(args)
        },
      })

      await assert.rejects(knex.raw('select * from missing_table'))

      assert.equal(calls.length, 1)
      assert.match(String(calls[0][0]), /^SQL ERROR \(\d+\.\d{3} ms\) /)
      assert.match(String(calls[0][0]), /missing_table/)
    } finally {
      await knex.destroy()
    }
  })
})

describe('defaultQueryFormatter', () => {
  it('formats bindings through knex 3 raw queries', async () => {
    const knex = createSqliteKnex()
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

  it('does not emit knex query events while formatting bindings', async () => {
    const knex = createSqliteKnex()
    const formatter = defaultQueryFormatter()
    const queryEvents: unknown[] = []
    const calls: unknown[][] = []

    try {
      knex.on('query', (query: unknown) => {
        queryEvents.push(query)
      })
      knexTinyLogger(knex, {
        logger(...args: unknown[]) {
          calls.push(args)
        },
      })

      assert.equal(
        formatter({
          knex,
          sql: 'select ? as id',
          bindings: [1],
        }),
        'select 1 as id',
      )

      assert.deepEqual(queryEvents, [])
      assert.deepEqual(calls, [])
    } finally {
      await knex.destroy()
    }
  })
})

describe('createTracer', () => {
  it('receives real knex query responses', async () => {
    const knex = createSqliteKnex()
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

  it('receives real knex query errors', async () => {
    const knex = createSqliteKnex()
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
})

function createSqliteKnex(): Knex {
  return createKnex({
    client: 'sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
  })
}
