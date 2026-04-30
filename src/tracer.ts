import type { Knex } from 'knex'
import { timingAdapter } from './timing.ts'
import type { CreateTracerOptions, QueryData, QueryStartEvent, Tracer, TracerQueryFinishEvent } from './types.ts'

export type {
  CreateTracerOptions,
  Tracer,
  TracerErrorEvent,
  TracerHooks,
  TracerQueryEndEvent,
  TracerQueryErrorEvent,
  TracerQueryFinishEvent,
} from './types.ts'

interface ActiveQuery extends QueryStartEvent {
  startTime: unknown
}

type KnexWithEvents = Knex & {
  on: (eventName: string, listener: (...args: unknown[]) => void) => KnexWithEvents
  off?: (eventName: string, listener: (...args: unknown[]) => void) => KnexWithEvents
  removeListener?: (eventName: string, listener: (...args: unknown[]) => void) => KnexWithEvents
}

/**
 * Attach low-level query tracing hooks to a Knex instance.
 *
 * The tracer reports raw query lifecycle data and never formats SQL. Hook
 * errors are caught and passed to `onTracerError`, which is a no-op by default.
 *
 * @example
 * ```ts
 * import { createTracer } from 'knex-tiny-logger/tracer'
 *
 * const tracer = createTracer(knex, {
 *   onEnd(event) {
 *     console.log(event.sql, event.durationMs)
 *   },
 * })
 *
 * tracer.dispose()
 * ```
 */
export function createTracer(knex: Knex, options: CreateTracerOptions = {}): Tracer {
  const { onStart, onEnd, onError, onTracerError = noopTracerErrorHandler } = options
  const knexWithEvents = knex as KnexWithEvents
  const queries = new Map<string, ActiveQuery>()
  const anonymousQueryIds = new WeakMap<object, string>()
  let nextAnonymousQueryId = 0

  const handleQuery = (query: unknown) => {
    const queryData = normalizeQueryData(query)
    const queryId = getQueryId(queryData)
    const event: ActiveQuery = {
      knex,
      queryId,
      sql: queryData.sql ?? '',
      bindings: queryData.bindings,
      query: queryData,
      startedAt: new Date(),
      startTime: timingAdapter.now(),
    }

    queries.set(queryId, event)
    handleTracerError(() => onStart?.(toStartEvent(event)))
  }

  const handleQueryResponse = (response: unknown, query: unknown) => {
    finishQuery(query, (event) => handleTracerError(() => onEnd?.({ ...event, response })))
  }

  const handleQueryError = (error: unknown, query: unknown) => {
    finishQuery(query, (event) => handleTracerError(() => onError?.({ ...event, error })))
  }

  knexWithEvents.on('query', handleQuery)
  knexWithEvents.on('query-response', handleQueryResponse)
  knexWithEvents.on('query-error', handleQueryError)

  return {
    dispose() {
      removeKnexListener(knexWithEvents, 'query', handleQuery)
      removeKnexListener(knexWithEvents, 'query-response', handleQueryResponse)
      removeKnexListener(knexWithEvents, 'query-error', handleQueryError)
    },
  }

  function finishQuery(query: unknown, handle: (event: TracerQueryFinishEvent) => void) {
    const queryId = getQueryId(normalizeQueryData(query))
    const activeQuery = queries.get(queryId)

    queries.delete(queryId)

    if (!activeQuery) {
      return
    }

    const baseEvent = {
      ...toStartEvent(activeQuery),
      durationMs: timingAdapter.duration(activeQuery.startTime),
    }

    handle(baseEvent)
  }

  function getQueryId(query: QueryData): string {
    if (query.__knexQueryUid != null) {
      return String(query.__knexQueryUid)
    }

    let anonymousQueryId = anonymousQueryIds.get(query)

    if (!anonymousQueryId) {
      nextAnonymousQueryId += 1
      anonymousQueryId = `anonymous:${nextAnonymousQueryId}`
      anonymousQueryIds.set(query, anonymousQueryId)
    }

    return anonymousQueryId
  }

  function handleTracerError(handle: () => void) {
    try {
      handle()
    } catch (error) {
      reportTracerError(error)
    }
  }

  function reportTracerError(error: unknown) {
    try {
      onTracerError({ error })
    } catch (tracerError) {
      noopTracerErrorHandler({ error: tracerError })
    }
  }
}

function normalizeQueryData(query: unknown): QueryData {
  if (query && typeof query === 'object') {
    return query as QueryData
  }

  return {}
}

function toStartEvent(query: ActiveQuery): QueryStartEvent {
  return {
    knex: query.knex,
    queryId: query.queryId,
    sql: query.sql,
    bindings: query.bindings,
    query: query.query,
    startedAt: query.startedAt,
  }
}

function removeKnexListener(knex: KnexWithEvents, eventName: string, listener: (...args: unknown[]) => void): void {
  if (typeof knex.off === 'function') {
    knex.off(eventName, listener)
    return
  }

  knex.removeListener?.(eventName, listener)
}

function noopTracerErrorHandler(_event: { error: unknown }): void {}
