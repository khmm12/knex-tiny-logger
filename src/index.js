// @flow

import type Knex from 'knex'
import chalk from 'chalk'

export type KnexTinyLoggerOptions = {
  logger?: (message?: any, ...optionalParams: any[]) => void,
  bindings?: boolean,
}

type KnexTinyLogger$StartTime = [number, number]

type KnexTinyLogger$Query = {
  sql: string,
  bindings: any,
  startTime: KnexTinyLogger$StartTime,
}

type KnexTinyLogger$KnexFormatQuery = (sql: string, bindings: any) => string
type Knex$QueryExecutionerFormat = (sql: string, bindings: any, timeZone?: string, client: Knex) => string

const COLORIZE = {
  primary: chalk.magenta,
  error: chalk.red,
  success: chalk.cyan,
}

/**
 * Decorate `knex` instance with logger
 *
 * @param {Object} knex - knex instance
 * @param {Object} options
 * @param {Function} [options.logger=console.log]
 * @param {Boolean} [options.bindings=true]
 * @return {Object} knex - knex instance
 */

export default function knexTinyLogger(knex: Knex, options?: KnexTinyLoggerOptions = {}): Knex {
  const { logger = console.log, bindings: withBindings = true } = options
  const queries: Map<string, KnexTinyLogger$Query> = new Map()
  const print = makeQueryPrinter(knex, { logger, withBindings })

  return knex.on('query', handleQuery).on('query-error', handleQueryError).on('query-response', handleQueryResponse)

  function handleQuery({ __knexQueryUid: queryId, sql, bindings }) {
    const startTime = measureStartTime()
    queries.set(queryId, { sql, bindings, startTime })
  }

  function handleQueryError(_error, { __knexQueryUid: queryId }) {
    withQuery(queryId, ({ sql, bindings, duration }) => {
      print({ sql, bindings, duration }, COLORIZE.error)
    })
  }

  function handleQueryResponse(_response, { __knexQueryUid: queryId }) {
    withQuery(queryId, ({ sql, bindings, duration }) => {
      print({ sql, bindings, duration }, COLORIZE.success)
    })
  }

  function withQuery(queryId, fn) {
    const query = queries.get(queryId)
    queries.delete(queryId)
    if (!query) throw new TypeError('Query disappeared')
    const { sql, bindings, startTime } = query
    const duration = measureDuration(startTime)
    fn({ sql, bindings, duration })
  }
}

function makeQueryPrinter(knex: Knex, { logger, withBindings }) {
  const formatQuery = getKnexFormatQuery(knex)

  return function print({ sql, bindings, duration }, colorize: Function) {
    const sqlRequest = formatQuery(sql, withBindings ? bindings : null)

    logger('%s %s', COLORIZE.primary(`SQL (${duration.toFixed(3)} ms)`), colorize(sqlRequest))
  }
}

function measureStartTime() {
  return process.hrtime()
}

function measureDuration(startTime: KnexTinyLogger$StartTime): number {
  const diff = process.hrtime(startTime)
  const duration = diff[0] * 1e3 + diff[1] * 1e-6
  return duration
}

function getKnexFormatQuery(knex: Knex): KnexTinyLogger$KnexFormatQuery {
  let queryExecutionerFormat: ?Knex$QueryExecutionerFormat

  if (typeof knex.client._formatQuery === 'function') {
    return (sql, bindings) => knex.client._formatQuery(sql, bindings)
  } else if ((queryExecutionerFormat = resolveQueryExecutionerFormat()) != null) {
    // $FlowExpectError
    return (sql, bindings) => queryExecutionerFormat(sql, bindings, undefined, knex)
  } else {
    return (sql) => sql
  }
}

function resolveQueryExecutionerFormat(): ?Knex$QueryExecutionerFormat {
  try {
    // $FlowExpectError
    const { formatQuery } = require('knex/lib/execution/internal/query-executioner')
    return typeof formatQuery === 'function' ? formatQuery : null
  } catch {
    return null
  }
}
