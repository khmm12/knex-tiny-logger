import assert from 'node:assert/strict'
import test from 'node:test'
import { hrtimeTimingAdapter, performanceTimingAdapter } from './timing.ts'

test('performance timing adapter measures duration with performance.now', () => {
  const originalPerformance = globalThis.performance
  let now = 100

  Object.defineProperty(globalThis, 'performance', {
    configurable: true,
    value: {
      now() {
        now += 5
        return now
      },
    },
  })

  try {
    const startTime = performanceTimingAdapter.now()

    assert.equal(performanceTimingAdapter.duration(startTime), 5)
  } finally {
    Object.defineProperty(globalThis, 'performance', {
      configurable: true,
      value: originalPerformance,
    })
  }
})

test('hrtime timing adapter measures duration with process.hrtime', () => {
  const startTime = hrtimeTimingAdapter.now()

  assert.ok(hrtimeTimingAdapter.duration(startTime) >= 0)
})
