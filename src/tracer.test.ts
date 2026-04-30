import assert from 'node:assert/strict'
import test from 'node:test'
import { createFakeKnex } from '../test/helpers/fake-knex.ts'
import { createTracer } from './tracer.ts'
import type { QueryStartEvent, TracerQueryEndEvent, TracerQueryErrorEvent } from './types.ts'

test('createTracer emits start and end events with duration', async () => {
  const knex = createFakeKnex()
  const startEvents: QueryStartEvent[] = []
  const endEvents: TracerQueryEndEvent[] = []
  const tracer = createTracer(knex, {
    onStart(event) {
      startEvents.push(event)
    },
    onEnd(event) {
      endEvents.push(event)
    },
  })

  knex.emit('query', { __knexQueryUid: 'query-1', sql: 'select ?', bindings: [1] })
  await new Promise((resolve) => setTimeout(resolve, 1))
  knex.emit('query-response', [{ id: 1 }], { __knexQueryUid: 'query-1' })

  assert.equal(startEvents.length, 1)
  assert.equal(startEvents[0].queryId, 'query-1')
  assert.equal(endEvents.length, 1)
  assert.equal(endEvents[0].sql, 'select ?')
  assert.deepEqual(endEvents[0].response, [{ id: 1 }])
  assert.ok(endEvents[0].durationMs >= 0)

  tracer.dispose()
  knex.emit('query', { __knexQueryUid: 'query-2', sql: 'select 2' })

  assert.equal(startEvents.length, 1)
  assert.equal(endEvents.length, 1)
})

test('createTracer emits error events', () => {
  const knex = createFakeKnex()
  const error = new Error('boom')
  const errors: TracerQueryErrorEvent[] = []

  createTracer(knex, {
    onError(event) {
      errors.push(event)
    },
  })

  knex.emit('query', { __knexQueryUid: 'query-1', sql: 'select ?', bindings: [1] })
  knex.emit('query-error', error, { __knexQueryUid: 'query-1' })

  assert.equal(errors.length, 1)
  assert.equal(errors[0].error, error)
  assert.equal(errors[0].sql, 'select ?')
})

test('createTracer ignores missing query finishes', () => {
  const knex = createFakeKnex()
  const errors: TracerQueryErrorEvent[] = []

  createTracer(knex, {
    onError(event) {
      errors.push(event)
    },
  })

  knex.emit('query-error', new Error('boom'), { __knexQueryUid: 'missing-query' })

  assert.equal(errors.length, 0)
})

test('createTracer reports logger errors without throwing', () => {
  const knex = createFakeKnex()
  const loggerError = new Error('logger failed')
  const loggerErrors: unknown[] = []

  createTracer(knex, {
    onEnd() {
      throw loggerError
    },
    onTracerError(event) {
      loggerErrors.push(event.error)
    },
  })

  assert.doesNotThrow(() => {
    knex.emit('query', { __knexQueryUid: 'query-1', sql: 'select 1' })
    knex.emit('query-response', [], { __knexQueryUid: 'query-1' })
  })
  assert.deepEqual(loggerErrors, [loggerError])
})

test('createTracer ignores tracer errors by default', () => {
  const knex = createFakeKnex()

  createTracer(knex, {
    onEnd() {
      throw new Error('logger failed')
    },
  })

  assert.doesNotThrow(() => {
    knex.emit('query', { __knexQueryUid: 'query-1', sql: 'select 1' })
    knex.emit('query-response', [], { __knexQueryUid: 'query-1' })
  })
})
