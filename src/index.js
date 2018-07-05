import chalk from 'chalk'

const COLORS = {
  success: 'cyan',
  error: 'red'
}

/**
 * Decorate `knex` instance with logger
 *
 * @param {Object} knex - knex instance
 * @param {Object} options
 * @param {Function} [options.logger=console.log]
 * @return {Object} knex - knex instance
 */

export default function knexTinyLogger (knex, { logger = console.log, bindings: withBindings = true } = {}) {
  const queries = new Map()
  const print = makeQueryPrinter(knex, { logger, withBindings })

  return knex
    .on('query', handleQuery)
    .on('query-error', handleQueryError)
    .on('query-response', handleQueryResponse)

  function handleQuery ({ __knexQueryUid: queryId, sql, bindings }) {
    const startTime = executionTime()
    queries.set(queryId, { sql, bindings, startTime })
  }

  function handleQueryError (_error, { __knexQueryUid: queryId }) {
    const { sql, bindings, startTime } = queries.get(queryId)
    const duration = executionTime(startTime)
    queries.delete(queryId)
    print({ sql, bindings, duration }, COLORS.error)
  }

  function handleQueryResponse (_response, { __knexQueryUid: queryId }) {
    const { sql, bindings, startTime } = queries.get(queryId)
    const duration = executionTime(startTime)
    queries.delete(queryId)
    print({ sql, bindings, duration }, COLORS.success)
  }
}

/**
 * Return duration in ms based `startTime`
 *
 * @example
 * const startTime = executionTime()
 * const duration = executionTime(startTime)
 *
 * @param {Object} [startTime]
 * @return {Number} duration in ms
 */

function executionTime (startTime) {
  if (startTime) {
    const diff = process.hrtime(startTime)
    const duration = diff[0] * 1e3 + diff[1] * 1e-6
    return duration
  } else {
    return process.hrtime()
  }
}

function makeQueryPrinter (knex, { logger, withBindings }) {
  return function print ({ sql, bindings, duration }, color) {
    const sqlRequest = knex.client._formatQuery(sql, withBindings ? bindings : null)

    logger('%s %s',
      chalk.magenta(`SQL (${duration.toFixed(3)} ms)`),
      chalk[color](sqlRequest)
    )
  }
}
