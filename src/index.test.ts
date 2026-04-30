import assert from 'node:assert/strict'
import test from 'node:test'
import { createFakeKnex } from '../test/helpers/fake-knex.ts'
import knexTinyLogger from './index.ts'

test('knexTinyLogger wires logger start hooks', () => {
  const knex = createFakeKnex()
  const startEvents: unknown[] = []

  knexTinyLogger(knex, {
    logger: {
      onStart(event) {
        startEvents.push(event)
      },
    },
  })

  knex.emit('query', { __knexQueryUid: 'query-1', sql: 'select ?', bindings: [1] })

  assert.equal(startEvents.length, 1)
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

test('knexTinyLogger falls back to console.error when logger error handlers throw', () => {
  const knex = createFakeKnex()
  const loggerError = new Error('logger failed')
  const handlerError = new Error('handler failed')
  const consoleErrors: unknown[][] = []
  const originalError = console.error

  console.error = (...args: unknown[]) => {
    consoleErrors.push(args)
  }

  try {
    knexTinyLogger(knex, {
      logger: {
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

  assert.deepEqual(consoleErrors, [[handlerError]])
})
