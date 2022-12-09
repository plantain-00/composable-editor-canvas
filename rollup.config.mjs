import { uglify } from 'rollup-plugin-uglify'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'

export default {
  input: 'packages/composable-canvas-editor/browser/index.js',
  plugins: [commonjs(), resolve({ browser: true }), uglify()],
  output: {
    name: 'ComposableEditorCanvas',
    file: 'packages/composable-canvas-editor/composable-editor-canvas.min.js',
    format: 'umd'
  }
}
