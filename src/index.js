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
    const startTime = process.hrtime()
    queries[queryId] = { sql, bindings, startTime }
  })
  .on('query-error', (_error, { __knexQueryUid: queryId }) => {
    delete queries[queryId]
  })
  .on('query-response', (response, { __knexQueryUid: queryId }) => {
    const { sql, bindings, startTime } = queries[queryId]
    delete queries[queryId]

    const diff = process.hrtime(startTime)
    const duration = diff[0] * 1e3 + diff[1] * 1e-6
    const sqlRequest = sql.split('?').reduce((memo, part, index) => {
      const binding = bindings[index] ? bindings[index] : ''
      return memo + part + binding
    }, '')

    logger('%s %s %s',
      chalk.gray('SQL'),
      chalk.cyan(sqlRequest),
      chalk.magenta(duration.toFixed(3) + 'ms')
    )
  })
  return knex
}
