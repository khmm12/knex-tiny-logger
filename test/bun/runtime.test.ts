import { expect, test } from 'bun:test'
import knexTinyLogger, { defaultLogger } from 'knex-tiny-logger'
import { pinoLogger } from 'knex-tiny-logger/pino'
import { createTracer } from 'knex-tiny-logger/tracer'

type Listener = (...args: unknown[]) => void

class FakeKnex {
  #listeners = new Map<string, Set<Listener>>()

  on(eventName: string, listener: Listener) {
    const listeners = this.#listeners.get(eventName) ?? new Set<Listener>()
    listeners.add(listener)
    this.#listeners.set(eventName, listeners)

    return this
  }

  off(eventName: string, listener: Listener) {
    this.#listeners.get(eventName)?.delete(listener)

    return this
  }

  emit(eventName: string, ...args: unknown[]) {
    for (const listener of this.#listeners.get(eventName) ?? []) {
      listener(...args)
    }
  }

  raw(sql: string, bindings: unknown) {
    return {
      toQuery() {
        return `${sql} -- ${JSON.stringify(bindings)}`
      },
    }
  }
}

test('package works in the Bun runtime', () => {
  const knex = new FakeKnex()
  const messages: string[] = []

  knexTinyLogger(knex as never, {
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

  expect(messages).toHaveLength(1)
  expect(messages[0]).toContain('SQL (')
  expect(messages[0]).toContain('select ? -- [1]')
})

test('subpath adapters work in the Bun runtime', () => {
  const knex = new FakeKnex()
  const entries: Record<string, unknown>[] = []
  const ends: unknown[] = []

  createTracer(knex as never, {
    onEnd(query) {
      ends.push(query)
    },
  })

  knexTinyLogger(knex as never, {
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

  expect(ends).toHaveLength(1)
  expect(entries).toHaveLength(1)
  expect(entries[0]).toMatchObject({
    sql: 'select ?',
    bindings: [2],
  })
  expect(typeof entries[0]?.durationMs).toBe('number')
})
