const { uglify } = require('rollup-plugin-uglify')
const commonjs = require('@rollup/plugin-commonjs')
const resolve = require('@rollup/plugin-node-resolve')

module.exports = {
  input: 'dist/browser/index.js',
  plugins: [commonjs(), resolve({ browser: true }), uglify()],
  output: {
    name: 'ComposableEditorCanvas',
    file: 'dist/composable-editor-canvas.min.js',
    format: 'umd'
  }
}
