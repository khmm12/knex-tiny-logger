import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import knexTinyLogger, { defaultLogger } from 'knex-tiny-logger'
import { pinoLogger } from 'knex-tiny-logger/pino'
import { createTracer } from 'knex-tiny-logger/tracer'

const require = createRequire(import.meta.url)

class FakeKnex {
  #listeners = new Map()

  on(eventName, listener) {
    const listeners = this.#listeners.get(eventName) ?? new Set()
    listeners.add(listener)
    this.#listeners.set(eventName, listeners)

    return this
  }

  off(eventName, listener) {
    this.#listeners.get(eventName)?.delete(listener)

    return this
  }

  emit(eventName, ...args) {
    for (const listener of this.#listeners.get(eventName) ?? []) {
      listener(...args)
    }
  }

  raw(sql, bindings) {
    return {
      toQuery() {
        return `${sql} -- ${JSON.stringify(bindings)}`
      },
    }
  }
}

test('esm package works in Node.js', () => {
  const knex = new FakeKnex()
  const messages = []

  knexTinyLogger(knex, {
    logger: defaultLogger({
      write(message) {
        messages.push(message)
      },
    }),
  })

  const query = {
    __knexQueryUid: 'query-1',
    sql: 'select ?',
    bindings: [1],
  }

  knex.emit('query', query)
  knex.emit('query-response', [{ value: 1 }], query)

  assert.equal(messages.length, 1)
  assert.match(messages[0], /SQL \(/)
  assert.match(messages[0], /select \? -- \[1\]/)
})

test('esm subpath adapters work in Node.js', () => {
  const knex = new FakeKnex()
  const entries = []
  const ends = []

  createTracer(knex, {
    onEnd(query) {
      ends.push(query)
    },
  })

  knexTinyLogger(knex, {
    logger: pinoLogger({
      info(entry) {
        entries.push(entry)
      },
      error(entry) {
        entries.push(entry)
      },
    }),
  })

  const query = {
    __knexQueryUid: 'query-2',
    sql: 'select ?',
    bindings: [2],
  }

  knex.emit('query', query)
  knex.emit('query-response', [{ value: 2 }], query)

  assert.equal(ends.length, 1)
  assert.equal(entries.length, 1)
  assert.deepEqual(entries[0].bindings, [2])
  assert.equal(entries[0].sql, 'select ?')
  assert.equal(typeof entries[0].durationMs, 'number')
})

test('commonjs package entrypoint works in Node.js', () => {
  const knexTinyLoggerCjs = require('knex-tiny-logger')
  const { colorfulLogger } = require('knex-tiny-logger/colorful')

  assert.equal(typeof knexTinyLoggerCjs, 'function')
  assert.equal(typeof knexTinyLoggerCjs.defaultLogger, 'function')
  assert.equal(typeof colorfulLogger, 'function')
})
