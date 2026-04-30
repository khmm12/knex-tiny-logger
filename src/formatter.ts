import type { Knex } from 'knex'
import type { DefaultQueryFormatterOptions, QueryFormatter, QueryFormatterInput } from './types.js'

export function defaultQueryFormatter(options: DefaultQueryFormatterOptions = {}): QueryFormatter {
  const { bindings: withBindings = true } = options

  return ({ knex, sql, bindings }: QueryFormatterInput): string => {
    if (!withBindings || !hasBindings(bindings)) {
      return sql
    }

    try {
      if (Array.isArray(bindings)) {
        return knex.raw(sql, bindings as readonly Knex.RawBinding[]).toQuery()
      }

      if (typeof bindings === 'object') {
        return knex.raw(sql, bindings as Knex.ValueDict).toQuery()
      }

      return knex.raw(sql, bindings as Knex.RawBinding).toQuery()
    } catch {
      return sql
    }
  }
}

function hasBindings(bindings: unknown): boolean {
  if (bindings == null) {
    return false
  }

  if (Array.isArray(bindings)) {
    return bindings.length > 0
  }

  if (typeof bindings === 'object') {
    return Object.keys(bindings).length > 0
  }

  return true
}
