import type ReactType from 'react'
import type produceType from 'immer'
import type { produceWithPatches } from 'immer'
import type * as core from '../../src'
import type * as model from '../models/model'

export type PluginContext = typeof core & typeof model & {
  React: typeof ReactType
  produce: typeof produceType
  produceWithPatches: typeof produceWithPatches
}
