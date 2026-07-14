import assert from 'node:assert/strict'
import test from 'node:test'
import { createQueryEndEvent, createQueryErrorEvent } from '../test/helpers/events.ts'
import { colorfulLogger } from './colorful-logger.ts'
import { colorfulSyntaxThemes } from './colorful-syntax.ts'
import type { QueryFormatterInput } from './types.ts'

const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')

test('colorfulLogger tints successful queries by state', () => {
  const calls: string[] = []
  const logger = colorfulLogger({
    write(message) {
      calls.push(message)
    },
  })

  logger.onEnd?.(createQueryEndEvent())

  assert.equal(calls.length, 1)
  assert.equal(calls[0]?.includes('\x1b[36mSQL (12.346 ms)\x1b[39m'), true)
  assert.equal(calls[0]?.includes('\x1b[36mselect ? -- [1]\x1b[39m'), true)
})

test('colorfulLogger tints failed queries by state', () => {
  const calls: string[] = []
  const logger = colorfulLogger({
    write(message) {
      calls.push(message)
    },
  })

  logger.onError?.(createQueryErrorEvent({ sql: 'select broken', bindings: [] }))

  assert.equal(calls.length, 1)
  assert.equal(calls[0]?.includes('\x1b[31mSQL ERROR (12.346 ms)\x1b[39m'), true)
  assert.equal(calls[0]?.includes('\x1b[31mselect broken\x1b[39m'), true)
})

test('colorfulLogger supports custom formatters', () => {
  const calls: string[] = []
  const logger = colorfulLogger({
    formatter(event) {
      return `${event.sql} -- custom`
    },
    write(message) {
      calls.push(message)
    },
  })

  logger.onEnd?.(createQueryEndEvent())

  assert.equal(calls.length, 1)
  assert.match(calls[0], /select \? -- custom/)
})

test('colorfulLogger highlights the SQL body in highlight mode', () => {
  const calls: string[] = []
  const logger = colorfulLogger({
    highlight: true,
    write(message) {
      calls.push(message)
    },
  })

  logger.onEnd?.(
    createQueryEndEvent({ sql: "select count(*) from users where id = 12 and name = 'Ada'", bindings: [] }),
  )

  assert.equal(calls.length, 1)
  // Label carries the query state; the body is syntax-highlighted, not tinted as one span.
  assert.equal(calls[0]?.includes('\x1b[36mSQL (12.346 ms)\x1b[39m'), true)
  assert.equal(calls[0]?.includes('\x1b[0m'), true)
  assert.equal(stripAnsi(calls[0] ?? ''), "SQL (12.346 ms) select count(*) from users where id = 12 and name = 'Ada'")
})

test('colorfulLogger highlights failed queries', () => {
  const calls: string[] = []
  const logger = colorfulLogger({
    highlight: true,
    write(message) {
      calls.push(message)
    },
  })

  logger.onError?.(createQueryErrorEvent({ sql: 'select broken', bindings: [] }))

  assert.equal(calls.length, 1)
  assert.equal(calls[0]?.includes('\x1b[31mSQL ERROR (12.346 ms)\x1b[39m'), true)
  assert.equal(stripAnsi(calls[0] ?? ''), 'SQL ERROR (12.346 ms) select broken')
})

test('colorfulLogger highlights with extended themes', () => {
  const calls: string[] = []
  const logger = colorfulLogger({
    highlight: true,
    theme: colorfulSyntaxThemes.default.extend({
      keyword: '<k>',
      fn: '<f>',
      clear: '</>',
    }),
    formatter() {
      return 'select max(age) from users'
    },
    write(message) {
      calls.push(message)
    },
  })

  logger.onEnd?.(createQueryEndEvent())

  assert.equal(calls[0]?.includes('<k>select</>'), true)
  assert.equal(calls[0]?.includes('<f>max</>'), true)
})

test('colorfulLogger highlights with bindings false', () => {
  const calls: string[] = []
  const logger = colorfulLogger({
    highlight: true,
    bindings: false,
    write(message) {
      calls.push(message)
    },
  })

  logger.onEnd?.(createQueryEndEvent({ sql: 'select ?', bindings: [1] }))

  assert.equal(stripAnsi(calls[0] ?? ''), 'SQL (12.346 ms) select ?')
})

test('colorfulLogger highlights custom formatter output', () => {
  const calls: string[] = []
  const logger = colorfulLogger({
    highlight: true,
    formatter(event) {
      return `${event.sql} -- custom`
    },
    write(message) {
      calls.push(message)
    },
  })

  logger.onEnd?.(createQueryEndEvent())

  assert.equal(stripAnsi(calls[0] ?? ''), 'SQL (12.346 ms) select ? -- custom')
  assert.equal(calls[0]?.includes('\x1b[0m'), true)
})

test('colorfulLogger highlights with a truecolor theme', () => {
  const calls: string[] = []
  const logger = colorfulLogger({
    highlight: true,
    theme: colorfulSyntaxThemes.solarizedLight,
    formatter() {
      return 'select 1'
    },
    write(message) {
      calls.push(message)
    },
  })

  logger.onEnd?.(createQueryEndEvent())

  assert.equal(stripAnsi(calls[0] ?? ''), 'SQL (12.346 ms) select 1')
})

test('colorfulLogger warns when bindings and formatter are provided together', () => {
  const warnings: unknown[][] = []
  const originalWarn = console.warn

  console.warn = (...args: unknown[]) => {
    warnings.push(args)
  }

  try {
    colorfulLogger({
      bindings: false,
      formatter(event: QueryFormatterInput) {
        return event.sql
      },
    } as unknown as Parameters<typeof colorfulLogger>[0])
  } finally {
    console.warn = originalWarn
  }

  assert.deepEqual(warnings, [['knex-tiny-logger: "bindings" is ignored when "formatter" is provided.']])
})

test('colorfulLogger warns when theme is provided without highlight', () => {
  const warnings: unknown[][] = []
  const originalWarn = console.warn

  console.warn = (...args: unknown[]) => {
    warnings.push(args)
  }

  try {
    colorfulLogger({ theme: colorfulSyntaxThemes.dracula } as unknown as Parameters<typeof colorfulLogger>[0])
  } finally {
    console.warn = originalWarn
  }

  assert.deepEqual(warnings, [['knex-tiny-logger: "theme" is ignored unless "highlight" is enabled.']])
})

test('colorfulLogger ignores theme without highlight and tints instead', () => {
  const calls: string[] = []
  const originalWarn = console.warn
  console.warn = () => {}

  try {
    const logger = colorfulLogger({
      theme: colorfulSyntaxThemes.dracula,
      write(message: string) {
        calls.push(message)
      },
    } as unknown as Parameters<typeof colorfulLogger>[0])
    logger.onEnd?.(createQueryEndEvent({ sql: 'select 1', bindings: [] }))
  } finally {
    console.warn = originalWarn
  }

  // Tinted as one span (no per-token clear), not syntax-highlighted.
  assert.equal(calls[0]?.includes('\x1b[36mselect 1\x1b[39m'), true)
  assert.equal(calls[0]?.includes('\x1b[0m'), false)
})

function stripAnsi(message: string): string {
  return message.replace(ANSI_PATTERN, '')
}
