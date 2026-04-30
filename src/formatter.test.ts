import assert from 'node:assert/strict'
import test from 'node:test'
import type { Knex } from 'knex'
import { createFakeKnex } from '../test/helpers/fake-knex.ts'
import { defaultQueryFormatter } from './formatter.ts'

test('defaultQueryFormatter returns raw SQL when bindings are disabled', () => {
  const formatter = defaultQueryFormatter({ bindings: false })

  assert.equal(
    formatter({
      knex: createFakeKnex(),
      sql: 'select ?',
      bindings: [1],
    }),
    'select ?',
  )
})

test('defaultQueryFormatter formats bindings through knex raw queries', () => {
  const formatter = defaultQueryFormatter()

  assert.equal(
    formatter({
      knex: createFakeKnex(),
      sql: 'select ?',
      bindings: [1],
    }),
    'select ? -- [1]',
  )
})

test('defaultQueryFormatter falls back to raw SQL when formatting fails', () => {
  const formatter = defaultQueryFormatter()

  assert.equal(
    formatter({
      knex: {
        raw() {
          throw new Error('no formatter')
        },
      } as unknown as Knex,
      sql: 'select ?',
      bindings: [1],
    }),
    'select ?',
  )
})
