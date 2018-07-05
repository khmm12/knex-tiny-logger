// @flow

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

export function start () {
  return process.hrtime()
}

export function stop (startTime: [number, number]): number {
  const diff = process.hrtime(startTime)
  const duration = diff[0] * 1e3 + diff[1] * 1e-6
  return duration
}
