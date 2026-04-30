import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  declaration: 'compatible',
  entries: ['./src/index', './src/colorful', './src/pino', './src/tracer'],
  rollup: {
    emitCJS: true,
    output: {
      exports: 'named',
      footer(chunk: { fileName: string }) {
        if (chunk.fileName !== 'index.cjs') {
          return ''
        }

        return 'module.exports = Object.assign(exports.default, exports, { default: exports.default })'
      },
    },
  },
})
