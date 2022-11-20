import type React from 'react'
import type { renderToStaticMarkup } from 'react-dom/server'
import type produce from 'immer'
import type { produceWithPatches } from 'immer'
import * as jsonEditor from "react-composable-json-editor"
import type * as core from '../../../src'
import type * as model from '../model'

export type PluginContext = typeof core & typeof model & typeof jsonEditor & {
  React: typeof React
  produce: typeof produce
  produceWithPatches: typeof produceWithPatches
  renderToStaticMarkup: typeof renderToStaticMarkup
}
