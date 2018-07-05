import chalk from 'chalk'

/**
 * Decorate `knex` instance with logger
 *
 * @param {Object} knex - knex instance
 * @param {Object} options
 * @param {Function} [options.logger=console.log]
 * @return {Object} knex - knex instance
 */

export default function knexTinyLogger (knex, { logger = console.log } = {}) {
  const queries = {}
  knex.on('query', ({ sql, bindings, __knexQueryUid: queryId }) => {
    const startTime = executionTime()
    queries[queryId] = { sql, bindings, startTime }
  })
  .on('query-error', (_error, { __knexQueryUid: queryId }) => {
    logQuery(queryId, 'red')
  })
  .on('query-response', (response, { __knexQueryUid: queryId }) => {
    logQuery(queryId)
  })
  return knex

  function logQuery (queryId, sqlOutputColor = 'cyan') {
    const { sql, bindings, startTime } = queries[queryId]
    delete queries[queryId]

    const duration = executionTime(startTime)
    const sqlRequest = insertBindingsToSQL(sql, bindings)

    logger('%s %s',
      chalk.magenta(`SQL (${duration.toFixed(3)} ms)`),
      chalk[sqlOutputColor](sqlRequest)
    )
  }
}

/**
 * Return SQL string with inserted bindings
 *
 * @param {String} sql - sql string without bindings
 * @param {Array} bindings
 * @return {String}
 */

function insertBindingsToSQL (sql, bindings) {
  return sql.replace(/\$\d+/g, replacer)

  function replacer (match) {
    const position = parseInt(match.replace('$', ''), 10)
    return bindings[position - 1] ? JSON.stringify(bindings[position - 1]) : match
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
