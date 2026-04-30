import type { Knex } from 'knex'
import type { QueryEndEvent, QueryErrorEvent } from '../../src/types.ts'
import { createFakeKnex } from './fake-knex.ts'

export function createQueryEndEvent(overrides: Partial<QueryEndEvent> = {}): QueryEndEvent {
  return {
    knex: createFakeKnex() as Knex,
    queryId: 'query-1',
    sql: 'select ?',
    bindings: [1],
    query: { sql: 'select ?', bindings: [1] },
    startedAt: new Date('2026-04-30T00:00:00.000Z'),
    durationMs: 12.34567,
    response: [],
    ...overrides,
  }
}

export function createQueryErrorEvent(overrides: Partial<QueryErrorEvent> = {}): QueryErrorEvent {
  return {
    ...createQueryEndEvent(),
    error: new Error('boom'),
    ...overrides,
  }
}
