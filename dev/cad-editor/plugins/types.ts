import type React from 'react'
import type { renderToStaticMarkup } from 'react-dom/server'
import type { produce, produceWithPatches } from 'immer'
import type { parseExpression, tokenizeExpression, evaluateExpression } from 'expression-engine'
import type * as core from '../../../src'
import type * as model from '../model'

export type PluginContext = typeof core & typeof model & {
  React: typeof React
  produce: typeof produce
  produceWithPatches: typeof produceWithPatches
  renderToStaticMarkup: typeof renderToStaticMarkup
  parseExpression: typeof parseExpression
  tokenizeExpression: typeof tokenizeExpression
  evaluateExpression: typeof evaluateExpression
}
