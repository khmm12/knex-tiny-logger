import { EventEmitter } from 'node:events'
import type { Knex } from 'knex'

export class FakeKnex extends EventEmitter {
  raw(sql: string, bindings: unknown) {
    return {
      toQuery() {
        return `${sql} -- ${JSON.stringify(bindings)}`
      },
    }
  }
}

export function createFakeKnex(): Knex & EventEmitter {
  return new FakeKnex() as unknown as Knex & EventEmitter
}
