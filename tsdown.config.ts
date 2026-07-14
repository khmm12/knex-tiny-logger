import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/colorful.ts', 'src/pino.ts', 'src/tracer.ts'],
  format: ['esm', 'cjs'],
  dts: { build: true },
  publint: true,
  attw: { profile: 'node16' },
  outputOptions(options, format) {
    // Keep the CJS require() value callable while still exposing the named
    // exports, e.g. `const knexTinyLogger = require('knex-tiny-logger')` stays
    // both callable and carries `defaultLogger` / `defaultQueryFormatter`.
    if (format === 'cjs') {
      options.footer = (chunk) =>
        chunk.fileName === 'index.cjs'
          ? 'module.exports = Object.assign(exports.default, exports, { default: exports.default });'
          : ''
    }
    return options
  },
  hooks: {
    // rolldown-plugin-dts emits the ESM-shaped `export { default, ... }` for the
    // CJS declaration too, which types the require() value as a non-callable
    // namespace. Rewrite it into the function/namespace merge so TypeScript (5-7)
    // sees a callable value carrying the named members. Mirrors the runtime footer.
    'build:done': async ({ options }) => {
      const file = path.join(options.outDir, 'index.d.cts')
      const code = await readFile(file, 'utf8')
      if (code.includes('declare namespace knexTinyLogger')) return

      const match = code.match(/\nexport \{([\s\S]*?)\};?\s*$/)
      if (match == null) throw new Error(`Unexpected index.d.cts shape: missing trailing export in ${file}`)

      const members = match[1]
      const merged = `\ndeclare namespace knexTinyLogger {\n\texport {${members}};\n}\nexport = knexTinyLogger;\n`
      await writeFile(file, code.slice(0, match.index) + merged)
    },
  },
})
