export interface TimingAdapter {
  now: () => unknown
  duration: (startTime: unknown) => number
}

interface PerformanceLike {
  now?: unknown
}

export const performanceTimingAdapter: TimingAdapter = {
  now() {
    return globalThis.performance.now()
  },
  duration(startTime) {
    return globalThis.performance.now() - Number(startTime)
  },
}

export const hrtimeTimingAdapter: TimingAdapter = {
  now() {
    return process.hrtime()
  },
  duration(startTime) {
    const diff = process.hrtime(startTime as [number, number])
    return diff[0] * 1e3 + diff[1] * 1e-6
  },
}

export function supportsPerformance(performance: PerformanceLike | null | undefined = globalThis.performance): boolean {
  return typeof performance?.now === 'function'
}

export function selectTimingAdapter(
  performance: PerformanceLike | null | undefined = globalThis.performance,
): TimingAdapter {
  return supportsPerformance(performance) ? performanceTimingAdapter : hrtimeTimingAdapter
}

export const timingAdapter: TimingAdapter = /* @__PURE__ */ selectTimingAdapter()
