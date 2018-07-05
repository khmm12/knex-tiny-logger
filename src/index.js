// @flow
import chalk from 'chalk'
import * as executionTime from './utils/execution-time'

export type KnexTinyLogger$Options = {
  logger?: Function,
  bindings?: boolean
}

type KnexTinyLogger$Query = {
  sql: string,
  bindings: any,
  startTime: [number, number]
}

const COLORIZE = {
  primary: chalk.magenta,
  error: chalk.red,
  success: chalk.cyan
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

export default function knexTinyLogger (knex: any, options?: KnexTinyLogger$Options = {}) {
  const { logger = console.log, bindings: withBindings = true } = options
  const queries: Map<string, KnexTinyLogger$Query> = new Map()
  const print = makeQueryPrinter(knex, { logger, withBindings })

  return knex
    .on('query', handleQuery)
    .on('query-error', handleQueryError)
    .on('query-response', handleQueryResponse)

  function handleQuery ({ __knexQueryUid: queryId, sql, bindings }) {
    const startTime = executionTime.start()
    queries.set(queryId, { sql, bindings, startTime })
  }

  function handleQueryError (_error, { __knexQueryUid: queryId }) {
    withQuery(queryId, ({ sql, bindings, duration }) => {
      print({ sql, bindings, duration }, COLORIZE.error)
    })
  }

  function handleQueryResponse (_response, { __knexQueryUid: queryId }) {
    withQuery(queryId, ({ sql, bindings, duration }) => {
      print({ sql, bindings, duration }, COLORIZE.success)
    })
  }

  function withQuery (queryId, fn) {
    const query = queries.get(queryId)
    queries.delete(queryId)
    if (!query) throw new Error('Query disappeared')
    const { sql, bindings, startTime } = query
    const duration = executionTime.stop(startTime)
    fn({ sql, bindings, duration })
  }
}

function makeQueryPrinter (knex, { logger, withBindings }) {
  return function print ({ sql, bindings, duration }, colorize: Function) {
    const sqlRequest = knex.client._formatQuery(sql, withBindings ? bindings : null)

    logger('%s %s',
      COLORIZE.primary(`SQL (${duration.toFixed(3)} ms)`),
      colorize(sqlRequest)
    )
  }
}
