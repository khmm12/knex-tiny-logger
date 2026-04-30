export interface TimingAdapter {
  now: () => unknown
  duration: (startTime: unknown) => number
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

export const timingAdapter: TimingAdapter =
  typeof globalThis.performance?.now === 'function' ? performanceTimingAdapter : hrtimeTimingAdapter
