import { uglify } from 'rollup-plugin-uglify'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'

export default {
  input: 'dist/browser/index.js',
  plugins: [commonjs(), resolve({ browser: true }), uglify()],
  output: {
    name: 'ComposableEditorCanvas',
    file: 'dist/composable-editor-canvas.min.js',
    format: 'umd'
  }
}
