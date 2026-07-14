import { highlightSql } from './colorful-syntax-highlight.ts'
import type { QueryFormatter } from './types.ts'

/** ANSI color for a SQL token role. `false` disables coloring for that role. */
export type ColorfulSyntaxColor = string | false

/** Partial ANSI color theme used by `colorful-syntax` helpers. */
export interface ColorfulSyntaxThemeInput {
  /** SQL reserved keywords. */
  keyword?: ColorfulSyntaxColor
  /** SQL functions. */
  fn?: ColorfulSyntaxColor
  /** Numbers. */
  number?: ColorfulSyntaxColor
  /** Strings. */
  string?: ColorfulSyntaxColor
  /** Special characters. */
  special?: ColorfulSyntaxColor
  /** Brackets / parentheses. */
  bracket?: ColorfulSyntaxColor
  /** Comments. */
  comment?: ColorfulSyntaxColor
  /** Clear code inserted after each colored match. */
  clear?: string
}

/**
 * Complete ANSI color theme used by `colorful-syntax` helpers.
 *
 * Exactly `ColorfulSyntaxThemeInput` with every role resolved and frozen, plus
 * `extend`. Kept in sync with the input via `Required` so the two can't drift.
 */
export interface ColorfulSyntaxTheme extends Readonly<Required<ColorfulSyntaxThemeInput>> {
  /** Return a new theme with these overrides applied. */
  extend(overrides: ColorfulSyntaxThemeInput): ColorfulSyntaxTheme
}

/** Options accepted by `colorizeSql` and `colorfulSyntaxFormatter`. */
export interface ColorfulSyntaxOptions {
  /** Partial theme merged over `colorfulSyntaxThemes.default`. */
  theme?: ColorfulSyntaxThemeInput
}

/**
 * `default` is a 16-color ANSI theme: it adapts to the terminal's palette and
 * works everywhere. The named themes below are fixed 24-bit truecolor and need
 * a truecolor-capable terminal.
 */
const DEFAULT_THEME_INPUT = {
  keyword: '\x1b[35m',
  fn: '\x1b[36m',
  number: '\x1b[33m',
  string: '\x1b[32m',
  special: '\x1b[90m',
  bracket: '\x1b[90m',
  comment: '\x1b[2m\x1b[90m',
  clear: '\x1b[0m',
} satisfies Required<ColorfulSyntaxThemeInput>

/** Build a 24-bit truecolor ANSI foreground escape. */
const rgb = /* @__NO_SIDE_EFFECTS__ */ (r: number, g: number, b: number): string => `\x1b[38;2;${r};${g};${b}m`

/** Built-in SQL syntax color themes. */
export const colorfulSyntaxThemes = /* @__PURE__ */ Object.freeze({
  /** Adaptive 16-color ANSI theme. Used when no theme is provided. */
  default: defineColorfulSyntaxTheme({}),
  dracula: defineColorfulSyntaxTheme({
    keyword: rgb(255, 121, 198),
    fn: rgb(80, 250, 123),
    number: rgb(189, 147, 249),
    string: rgb(241, 250, 140),
    special: rgb(255, 121, 198),
    bracket: rgb(248, 248, 242),
    comment: rgb(98, 114, 164),
  }),
  nord: defineColorfulSyntaxTheme({
    keyword: rgb(129, 161, 193),
    fn: rgb(136, 192, 208),
    number: rgb(180, 142, 173),
    string: rgb(163, 190, 140),
    special: rgb(129, 161, 193),
    bracket: rgb(236, 239, 244),
    comment: rgb(76, 86, 106),
  }),
  monokai: defineColorfulSyntaxTheme({
    keyword: rgb(249, 38, 114),
    fn: rgb(166, 226, 46),
    number: rgb(174, 129, 255),
    string: rgb(230, 219, 116),
    special: rgb(249, 38, 114),
    bracket: rgb(248, 248, 242),
    comment: rgb(117, 113, 94),
  }),
  oneDark: defineColorfulSyntaxTheme({
    keyword: rgb(198, 120, 221),
    fn: rgb(97, 175, 239),
    number: rgb(209, 154, 102),
    string: rgb(152, 195, 121),
    special: rgb(86, 182, 194),
    bracket: rgb(171, 178, 191),
    comment: rgb(92, 99, 112),
  }),
  solarizedDark: defineColorfulSyntaxTheme({
    keyword: rgb(133, 153, 0),
    fn: rgb(38, 139, 210),
    number: rgb(211, 54, 130),
    string: rgb(42, 161, 152),
    special: rgb(131, 148, 150),
    bracket: rgb(131, 148, 150),
    comment: rgb(88, 110, 117),
  }),
  tokyoNight: defineColorfulSyntaxTheme({
    keyword: rgb(187, 154, 247),
    fn: rgb(122, 162, 247),
    number: rgb(255, 158, 100),
    string: rgb(158, 206, 106),
    special: rgb(137, 221, 255),
    bracket: rgb(192, 202, 245),
    comment: rgb(86, 95, 137),
  }),
  catppuccinMocha: defineColorfulSyntaxTheme({
    keyword: rgb(203, 166, 247),
    fn: rgb(137, 180, 250),
    number: rgb(250, 179, 135),
    string: rgb(166, 227, 161),
    special: rgb(137, 220, 235),
    bracket: rgb(186, 194, 222),
    comment: rgb(108, 112, 134),
  }),
  solarizedLight: defineColorfulSyntaxTheme({
    keyword: rgb(133, 153, 0),
    fn: rgb(38, 139, 210),
    number: rgb(211, 54, 130),
    string: rgb(42, 161, 152),
    special: rgb(101, 123, 131),
    bracket: rgb(101, 123, 131),
    comment: rgb(147, 161, 161),
  }),
  githubLight: defineColorfulSyntaxTheme({
    keyword: rgb(207, 34, 46),
    fn: rgb(130, 80, 223),
    number: rgb(5, 80, 174),
    string: rgb(10, 48, 105),
    special: rgb(87, 96, 106),
    bracket: rgb(36, 41, 47),
    comment: rgb(110, 119, 129),
  }),
  oneLight: defineColorfulSyntaxTheme({
    keyword: rgb(166, 38, 164),
    fn: rgb(64, 120, 242),
    number: rgb(152, 104, 1),
    string: rgb(80, 161, 79),
    special: rgb(160, 161, 167),
    bracket: rgb(56, 58, 66),
    comment: rgb(160, 161, 167),
  }),
  catppuccinLatte: defineColorfulSyntaxTheme({
    keyword: rgb(136, 57, 239),
    fn: rgb(30, 102, 245),
    number: rgb(254, 100, 11),
    string: rgb(64, 160, 43),
    special: rgb(108, 111, 133),
    bracket: rgb(108, 111, 133),
    comment: rgb(140, 143, 161),
  }),
})

/** Create a query formatter that syntax-colors another query formatter's SQL output. */
export function colorfulSyntaxFormatter(
  formatter: QueryFormatter,
  options: ColorfulSyntaxOptions = {},
): QueryFormatter {
  const theme = defineColorfulSyntaxTheme(options.theme ?? {})

  return (query) => highlightSql(formatter(query), theme)
}

/** Syntax-color a SQL string with ANSI colors. */
export function colorizeSql(sql: string, options: ColorfulSyntaxOptions = {}): string {
  return highlightSql(sql, defineColorfulSyntaxTheme(options.theme ?? {}))
}

/* @__NO_SIDE_EFFECTS__ */ function defineColorfulSyntaxTheme(input: ColorfulSyntaxThemeInput): ColorfulSyntaxTheme {
  const theme: ColorfulSyntaxTheme = {
    keyword: input.keyword ?? DEFAULT_THEME_INPUT.keyword,
    fn: input.fn ?? DEFAULT_THEME_INPUT.fn,
    number: input.number ?? DEFAULT_THEME_INPUT.number,
    string: input.string ?? DEFAULT_THEME_INPUT.string,
    special: input.special ?? DEFAULT_THEME_INPUT.special,
    bracket: input.bracket ?? DEFAULT_THEME_INPUT.bracket,
    comment: input.comment ?? DEFAULT_THEME_INPUT.comment,
    clear: input.clear ?? DEFAULT_THEME_INPUT.clear,
    extend(overrides: ColorfulSyntaxThemeInput) {
      return defineColorfulSyntaxTheme({ ...theme, ...overrides })
    },
  }

  // `extend` is a helper, not a themable color: keep it off enumeration and spreads.
  Object.defineProperty(theme, 'extend', { enumerable: false })

  return Object.freeze(theme)
}
