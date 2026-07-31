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
 * The tracer exposes query lifecycle events with duration, SQL, bindings, and
 * errors. Knex transaction control statements are excluded because they do not
 * emit complete query lifecycles.
 *
 * Hook errors are caught and passed to `onTracerError`, which is a no-op by
 * default.
 *
 * @example
 * ```ts
 * import { createTracer } from 'knex-tiny-logger/tracer'
 *
 * const spans = new Map()
 *
 * const tracer = createTracer(knex, {
 *   onStart(event) {
 *     spans.set(event.queryId, tracerProvider.startSpan('sql', {
 *       sql: event.sql,
 *       bindings: event.bindings,
 *     }))
 *   },
 *   onEnd(event) {
 *     spans.get(event.queryId)?.end({ durationMs: event.durationMs })
 *     spans.delete(event.queryId)
 *   },
 *   onError(event) {
 *     spans.get(event.queryId)?.fail(event.error)
 *     spans.delete(event.queryId)
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
  const anonymousQueryIds = new WeakMap<QueryData, string>()
  let nextAnonymousQueryId = 0

  const handleQuery = (query: unknown) => {
    if (!isQueryData(query) || isTransactionControlQuery(query)) return

    const queryId = createQueryId(query)
    const event: ActiveQuery = {
      knex,
      queryId,
      sql: query.sql,
      bindings: query.bindings,
      query,
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
    if (!isQueryData(query) || isTransactionControlQuery(query)) return

    const queryId = findQueryId(query)
    if (queryId == null) return

    const activeQuery = queries.get(queryId)
    queries.delete(queryId)
    if (activeQuery == null) return

    const baseEvent = {
      ...toStartEvent(activeQuery),
      durationMs: timingAdapter.duration(activeQuery.startTime),
    }

    handle(baseEvent)
  }

  function createQueryId(query: QueryData): string {
    if (query.__knexQueryUid != null) return String(query.__knexQueryUid)

    let anonymousQueryId = anonymousQueryIds.get(query)

    if (!anonymousQueryId) {
      nextAnonymousQueryId += 1
      anonymousQueryId = `anonymous:${nextAnonymousQueryId}`
      anonymousQueryIds.set(query, anonymousQueryId)
    }

    return anonymousQueryId
  }

  function findQueryId(query: QueryData): string | undefined {
    if (query.__knexQueryUid != null) return String(query.__knexQueryUid)

    const queryId = anonymousQueryIds.get(query)
    if (queryId != null) return queryId

    // Knex schema queries omit __knexQueryUid and copy the query object before
    // emitting query-response. Match the stable fields retained by that copy.
    for (const [activeQueryId, activeQuery] of queries) {
      if (isSameAnonymousQuery(activeQuery.query, query)) {
        return activeQueryId
      }
    }

    return undefined
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

function isSameAnonymousQuery(started: QueryData, finished: QueryData): boolean {
  return (
    started.__knexQueryUid == null &&
    started.sql === finished.sql &&
    started.bindings === finished.bindings &&
    started.__knexUid === finished.__knexUid &&
    started.__knexTxId === finished.__knexTxId
  )
}

function isQueryData(query: unknown): query is QueryData {
  return query != null && typeof query === 'object' && 'sql' in query && typeof query.sql === 'string'
}

function isTransactionControlQuery(query: QueryData): boolean {
  // Knex runs these outside Runner and does not emit matching successful
  // query-response events, so they cannot form a complete query lifecycle.
  return query.__knexQueryUid == null && isKnownTransactionControlSql(query.sql)
}

function isKnownTransactionControlSql(sql: string): boolean {
  const statement = sql.trim().replace(/;$/, '').trim()

  if (/^(?:BEGIN|COMMIT|ROLLBACK)$/i.test(statement)) return true
  if (/^BEGIN(?:\s+TRANSACTION)?\s+(?:ISOLATION\s+LEVEL\s+.+|READ\s+ONLY)$/i.test(statement)) return true
  if (/^SET\s+TRANSACTION\s+.+$/i.test(statement)) return true
  if (/^(?:SAVEPOINT|RELEASE\s+SAVEPOINT|ROLLBACK\s+TO\s+SAVEPOINT)\s+\S+$/i.test(statement)) return true
  return /^SAVE\s+TRANSACTION(?:\s+\[[^\]]+\])?$|^ROLLBACK\s+TRANSACTION$/i.test(statement)
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
