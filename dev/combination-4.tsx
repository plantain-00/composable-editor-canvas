import React from 'react'
import { Nullable } from '../src'
import { CircuitGraphEditor, CircuitGraphEditorRef } from './circuit-graph-editor/circuit-graph-editor'
import { BaseContent } from './circuit-graph-editor/model'

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)

export function Combination4() {
  const [initialState] = React.useState<Nullable<BaseContent>[]>([])
  const editorRef = React.useRef<CircuitGraphEditorRef | null>(null)

  return initialState ? (
    <div>
      <CircuitGraphEditor
        operator={me}
        ref={editorRef}
        initialState={initialState}
      />
    </div>
  ) : null
}
