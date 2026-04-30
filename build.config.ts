import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  declaration: 'compatible',
  rollup: {
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
