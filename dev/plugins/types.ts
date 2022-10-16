import type React from 'react'
import type { renderToStaticMarkup } from 'react-dom/server'
import type produce from 'immer'
import type { produceWithPatches } from 'immer'
import type * as core from '../../src'
import type * as model from '../models/model'

export type PluginContext = typeof core & typeof model & {
  React: typeof React
  produce: typeof produce
  produceWithPatches: typeof produceWithPatches
  renderToStaticMarkup: typeof renderToStaticMarkup
}
