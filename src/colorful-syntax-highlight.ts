import type { ColorfulSyntaxColor, ColorfulSyntaxTheme } from './colorful-syntax.ts'

const KEYWORDS = /* @__PURE__ */ new Set([
  'add',
  'all',
  'alter',
  'and',
  'as',
  'asc',
  'between',
  'by',
  'case',
  'check',
  'column',
  'constraint',
  'create',
  'cross',
  'database',
  'default',
  'delete',
  'desc',
  'distinct',
  'drop',
  'else',
  'end',
  'except',
  'exists',
  'false',
  'for',
  'foreign',
  'from',
  'full',
  'group',
  'having',
  'in',
  'index',
  'inner',
  'insert',
  'intersect',
  'into',
  'is',
  'join',
  'key',
  'left',
  'like',
  'limit',
  'not',
  'null',
  'offset',
  'on',
  'or',
  'order',
  'outer',
  'primary',
  'references',
  'returning',
  'right',
  'select',
  'set',
  'table',
  'then',
  'true',
  'union',
  'unique',
  'update',
  'using',
  'values',
  'when',
  'where',
  'with',
])

/**
 * Tokenize a SQL string and color the recognized tokens (keywords, functions,
 * numbers, strings, comments, brackets, special chars) with the theme's ANSI
 * colors. Other identifiers pass through uncolored.
 */
export function highlightSql(sql: string, colors: ColorfulSyntaxTheme): string {
  let result = ''
  let index = 0

  while (index < sql.length) {
    const char = sql[index]
    const next = sql[index + 1]

    if (isWhitespace(char)) {
      result += char
      index += 1
      continue
    }

    if (char === '-' && next === '-') {
      const end = findLineCommentEnd(sql, index + 2)
      result += colorize(sql.slice(index, end), colors.comment, colors.clear)
      index = end
      continue
    }

    if (char === '/' && next === '*') {
      const end = findBlockCommentEnd(sql, index + 2)
      result += colorize(sql.slice(index, end), colors.comment, colors.clear)
      index = end
      continue
    }

    if (char === "'" || char === '"') {
      const end = findStringEnd(sql, index + 1, char)
      result += colorize(sql.slice(index, end), colors.string, colors.clear)
      index = end
      continue
    }

    if (isNumberStart(sql, index)) {
      const end = findNumberEnd(sql, index)
      result += colorize(sql.slice(index, end), colors.number, colors.clear)
      index = end
      continue
    }

    if (isIdentifierStart(char)) {
      const end = findIdentifierEnd(sql, index + 1)
      const word = sql.slice(index, end)
      const lowerWord = word.toLowerCase()

      if (KEYWORDS.has(lowerWord)) {
        result += colorize(word, colors.keyword, colors.clear)
      } else if (isFunctionCall(sql, end)) {
        result += colorize(word, colors.fn, colors.clear)
      } else {
        result += word
      }

      index = end
      continue
    }

    if (char === '(' || char === ')') {
      result += colorize(char, colors.bracket, colors.clear)
      index += 1
      continue
    }

    result += colorize(char, colors.special, colors.clear)
    index += 1
  }

  return result
}

function colorize(token: string, color: ColorfulSyntaxColor, clear: string): string {
  if (color === false) {
    return token
  }

  return `${color}${token}${clear}`
}

function isWhitespace(char: string | undefined): boolean {
  return char === ' ' || char === '\n' || char === '\r' || char === '\t'
}

function findLineCommentEnd(sql: string, index: number): number {
  while (index < sql.length && sql[index] !== '\n' && sql[index] !== '\r') {
    index += 1
  }

  return index
}

function findBlockCommentEnd(sql: string, index: number): number {
  const end = sql.indexOf('*/', index)

  return end === -1 ? sql.length : end + 2
}

function findStringEnd(sql: string, index: number, quote: string): number {
  while (index < sql.length) {
    if (sql[index] === quote) {
      if (sql[index + 1] === quote) {
        index += 2
        continue
      }

      return index + 1
    }

    if (sql[index] === '\\') {
      index += 2
      continue
    }

    index += 1
  }

  return index
}

function isNumberStart(sql: string, index: number): boolean {
  const char = sql[index]
  const next = sql[index + 1]

  return isDigit(char) || (char === '.' && isDigit(next))
}

function findNumberEnd(sql: string, index: number): number {
  if (sql[index] === '.') {
    index += 1
  }

  while (isDigit(sql[index])) {
    index += 1
  }

  if (sql[index] === '.') {
    index += 1

    while (isDigit(sql[index])) {
      index += 1
    }
  }

  if (sql[index]?.toLowerCase() === 'e') {
    const exponentStart = index
    index += 1

    if (sql[index] === '+' || sql[index] === '-') {
      index += 1
    }

    if (!isDigit(sql[index])) {
      return exponentStart
    }

    while (isDigit(sql[index])) {
      index += 1
    }
  }

  return index
}

function isDigit(char: string | undefined): boolean {
  return char != null && char >= '0' && char <= '9'
}

function isIdentifierStart(char: string | undefined): boolean {
  return char != null && ((char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z') || char === '_')
}

function isIdentifierPart(char: string | undefined): boolean {
  return isIdentifierStart(char) || isDigit(char) || char === '$'
}

function findIdentifierEnd(sql: string, index: number): number {
  while (isIdentifierPart(sql[index])) {
    index += 1
  }

  return index
}

function isFunctionCall(sql: string, index: number): boolean {
  while (isWhitespace(sql[index])) {
    index += 1
  }

  return sql[index] === '('
}
