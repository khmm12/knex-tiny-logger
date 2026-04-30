import assert from 'node:assert/strict'
import test from 'node:test'
import { hrtimeTimingAdapter, performanceTimingAdapter, selectTimingAdapter, supportsPerformance } from './timing.ts'

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

test('supportsPerformance detects performance.now support', () => {
  assert.equal(supportsPerformance({ now: () => 0 }), true)
  assert.equal(supportsPerformance(null), false)
  assert.equal(supportsPerformance({}), false)
})

test('selectTimingAdapter prefers performance.now when available', () => {
  assert.equal(selectTimingAdapter({ now: () => 0 }), performanceTimingAdapter)
  assert.equal(selectTimingAdapter(null), hrtimeTimingAdapter)
})
