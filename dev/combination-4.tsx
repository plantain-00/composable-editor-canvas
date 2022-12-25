import React from 'react'
import { Nullable, useLocalStorageState } from '../src'
import { CircuitGraphEditor } from './circuit-graph-editor/circuit-graph-editor'
import { BaseContent } from './circuit-graph-editor/model'

const testData = [
  {
    type: 'junction',
    position: { x: 100, y: 100 },
  },
  {
    type: 'junction',
    position: { x: 300, y: 100 },
  },
  {
    type: 'power',
    start: 0,
    end: 1,
    value: 10,
  },
]

export function Combination4() {
  const [, onChange, initialState] = useLocalStorageState<readonly Nullable<BaseContent>[]>('composable-editor-canvas-combination-4', testData)
  return (
    <div>
      <CircuitGraphEditor
        initialState={initialState}
        onChange={onChange}
      />
    </div>
  )
}
