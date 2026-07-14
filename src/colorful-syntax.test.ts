import assert from 'node:assert/strict'
import test from 'node:test'
import { createQueryEndEvent } from '../test/helpers/events.ts'
import { colorfulSyntaxFormatter, colorfulSyntaxThemes, colorizeSql } from './colorful-syntax.ts'

const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')

test('colorfulSyntaxThemes extend themes without mutating built-ins', () => {
  const theme = colorfulSyntaxThemes.dracula.extend({
    keyword: false,
    fn: '<f>',
  })

  assert.equal(theme.keyword, false)
  assert.equal(theme.fn, '<f>')
  assert.notEqual(colorfulSyntaxThemes.dracula.keyword, false)
  assert.notEqual(colorfulSyntaxThemes.dracula.fn, '<f>')
})

test('colorfulSyntaxThemes are chainable', () => {
  const theme = colorfulSyntaxThemes.dracula.extend({ keyword: '<k>' }).extend({ keyword: false })

  assert.equal(theme.keyword, false)
  assert.equal(theme.fn, colorfulSyntaxThemes.dracula.fn)
})

test('colorfulSyntaxThemes extend method is not enumerable', () => {
  const theme = colorfulSyntaxThemes.dracula.extend({ keyword: '<k>' })

  assert.equal(Object.keys(theme).includes('extend'), false)
  assert.equal(Object.keys(colorfulSyntaxThemes.dracula).includes('extend'), false)
  assert.equal(Object.hasOwn(theme, 'extend'), true)
})

test('colorizeSql supports partial themes and disabled token colors', () => {
  const sql = 'select count(*) from users'
  const colorized = colorizeSql(sql, {
    theme: {
      keyword: false,
      fn: '<f>',
      clear: '</>',
    },
  })

  assert.equal(stripAnsi(colorized.replaceAll('<f>', '').replaceAll('</>', '')), sql)
  assert.equal(colorized.includes('select</>'), false)
  assert.equal(colorized.includes('<f>count</>'), true)
  assert.equal(colorized.includes('\x1b[90m(</>'), true)
})

test('colorfulSyntaxFormatter colors formatter output', () => {
  const formatter = colorfulSyntaxFormatter(() => 'select count(*) from users', {
    theme: {
      keyword: '<k>',
      fn: '<f>',
      clear: '</>',
    },
  })

  assert.equal(formatter(createQueryEndEvent()).includes('<k>select</>'), true)
  assert.equal(formatter(createQueryEndEvent()).includes('<f>count</>'), true)
})

test('colorizeSql preserves the original text (round-trip)', () => {
  const inputs = [
    "select id, count(*) from users where id = 12 and name = 'Ada'",
    "select 'it''s doubled', 'a\\b escaped', 'unterminated",
    'select "quoted_ident", 1.5, .5, 1e-5, 1.5e10, 1e, 2.',
    'select a::int, b >= 1 /* block comment */ from t',
    'select 1\nfrom t -- trailing',
    'select * from t /* unterminated block comment',
    'update t set x = 1 where y >= 2 -- trailing comment',
    'SELECT DISTINCT a FROM b',
    'select values(x), count (*)',
  ]

  for (const sql of inputs) {
    assert.equal(stripAnsi(colorizeSql(sql)), sql)
  }
})

test('colorizeSql colors each token role with the theme', () => {
  const out = colorizeSql("select count(*) from t where a = 1 and b = 'x' -- note", {
    theme: {
      keyword: '<kw>',
      fn: '<fn>',
      number: '<n>',
      string: '<s>',
      special: '<sp>',
      bracket: '<br>',
      comment: '<c>',
      clear: '</>',
    },
  })

  assert.equal(out.includes('<kw>select</>'), true)
  assert.equal(out.includes('<fn>count</>'), true)
  assert.equal(out.includes('<br>(</>'), true)
  assert.equal(out.includes('<sp>*</>'), true)
  assert.equal(out.includes('<n>1</>'), true)
  assert.equal(out.includes("<s>'x'</>"), true)
  assert.equal(out.includes('<c>-- note</>'), true)
})

test('colorizeSql default theme uses the documented ANSI palette', () => {
  const out = colorizeSql("select 1, 'x' -- c")

  assert.equal(out.includes('\x1b[35mselect\x1b[0m'), true)
  assert.equal(out.includes('\x1b[33m1\x1b[0m'), true)
  assert.equal(out.includes("\x1b[32m'x'\x1b[0m"), true)
  assert.equal(out.includes('\x1b[2m\x1b[90m-- c\x1b[0m'), true)
})

function stripAnsi(message: string): string {
  return message.replace(ANSI_PATTERN, '')
}
