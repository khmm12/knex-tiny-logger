import { SpanKind, SpanStatusCode } from '@opentelemetry/api'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { BatchSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import createKnex from 'knex'
import { createTracer } from 'knex-tiny-logger/tracer'

const provider = new NodeTracerProvider({
  resource: resourceFromAttributes({
    'service.name': 'knex-tiny-logger-example',
  }),
  spanProcessors: [new BatchSpanProcessor(new ConsoleSpanExporter())],
})

provider.register()

const otelTracer = provider.getTracer('knex-tiny-logger-example')
const activeSpans = new Map()
const knex = createKnex({
  client: 'sqlite3',
  connection: {
    filename: ':memory:',
  },
  useNullAsDefault: true,
})

const knexTracer = createTracer(knex, {
  onStart(query) {
    activeSpans.set(
      query.queryId,
      otelTracer.startSpan('sqlite', {
        kind: SpanKind.CLIENT,
        startTime: query.startedAt,
        attributes: {
          'db.system.name': 'sqlite',
          // Knex-bound values normally remain placeholders; raw fragments may still contain literals.
          'db.query.text': query.sql,
        },
      }),
    )
  },
  onEnd(query) {
    finishSpan(query.queryId)
  },
  onError(query) {
    const span = activeSpans.get(query.queryId)

    if (!span) {
      return
    }

    activeSpans.delete(query.queryId)

    if (query.error instanceof Error) {
      // Driver errors may contain rendered SQL. Redact them first if that data is sensitive.
      span.recordException(query.error)
      span.setAttribute('error.type', query.error.name)
    }

    span.setStatus({ code: SpanStatusCode.ERROR })
    span.end()
  },
  onTracerError(event) {
    console.error('OpenTelemetry hook failed:', event.error)
  },
})

try {
  await otelTracer.startActiveSpan('example', async (span) => {
    try {
      await knex.schema.createTable('users', (table) => {
        table.increments('id')
        table.string('name').notNullable()
      })

      await knex('users').insert([{ name: 'Ada' }, { name: 'Grace' }])
      await knex('users').where({ name: 'Grace' }).select('id', 'name')

      try {
        await knex.raw('select * from missing_table where id = ?', [1])
      } catch {
        // Keep running so the failed query span is exported alongside successful ones.
      }
    } finally {
      span.end()
    }
  })
} finally {
  knexTracer.dispose()
  await Promise.all([knex.destroy(), provider.shutdown()])
}

function finishSpan(queryId) {
  const span = activeSpans.get(queryId)

  if (!span) {
    return
  }

  activeSpans.delete(queryId)
  span.end()
}
