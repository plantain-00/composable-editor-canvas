import React from 'react'
import { setWsHeartbeat } from 'ws-heartbeat/client'
import { Patch } from 'immer'
import { Nullable } from '../src'
import { CircuitGraphEditor, CircuitGraphEditorRef } from './circuit-graph-editor/circuit-graph-editor'
import { BaseContent } from './circuit-graph-editor/model'

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)
const key = 'combination-4.json'

export function Combination4() {
  const [initialState, setInitialState] = React.useState<Nullable<BaseContent>[]>()
  const editorRef = React.useRef<CircuitGraphEditorRef | null>(null)

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`https://storage.yorkyao.com/${key}`)
        const json: Nullable<BaseContent>[] = await res.json()
        setInitialState(json)
      } catch {
        setInitialState([])
      }
    })()
  }, [])

  const ws = React.useRef<WebSocket>()
  React.useEffect(() => {
    ws.current = new WebSocket(`wss://storage.yorkyao.com/ws/composable-editor-canvas?key=${key}`)
    setWsHeartbeat(ws.current, '{"method":"ping"}')
    return () => ws.current?.close()
  }, [])

  const onApplyPatchesFromSelf = (patches: Patch[], reversePatches: Patch[]) => {
    if (ws.current && ws.current.readyState === ws.current.OPEN) {
      const operations = patches.map((p) => ({ ...p, path: p.path.map((c) => `/${c}`).join('') }))
      ws.current.send(JSON.stringify({ method: 'patch', operations, reversePatches, operator: me }))
    }
  }
  React.useEffect(() => {
    if (!ws.current || !editorRef.current) {
      return
    }
    ws.current.onmessage = (data: MessageEvent<unknown>) => {
      if (editorRef.current && typeof data.data === 'string' && data.data) {
        const json = JSON.parse(data.data) as
          | { method: 'patch', operations: (Omit<Patch, 'path'> & { path: string })[], reversePatches: Patch[], operator: string }
        if (json.method === 'patch') {
          editorRef.current.handlePatchesEvent({
            ...json,
            patches: json.operations.map((p) => ({ ...p, path: p.path.substring(1).split('/') }))
          })
        }
      }
    }
  }, [ws.current, editorRef.current])
  return initialState ? (
    <div>
      <CircuitGraphEditor
        operator={me}
        ref={editorRef}
        initialState={initialState}
        onApplyPatchesFromSelf={onApplyPatchesFromSelf}
      />
    </div>
  ) : null
}
