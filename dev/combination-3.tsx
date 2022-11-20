import React from "react"
import { reactCanvasRenderTarget, ReactRenderTarget, reactSvgRenderTarget } from "../src"
import { setWsHeartbeat } from 'ws-heartbeat/client'
import { Patch } from "immer/dist/types/types-external"
import { produceWithPatches } from "immer"
import { defaultFontFamily, defaultFontSize, RichTextBlock, RichTextEditor, RichTextEditorRef } from "./rich-text-editor/rich-text-editor"
import { blocksToHtml } from "./rich-text-editor/export-to-html"

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)
const key = 'combination-3.json'

export function Combination3() {
  const [initialState, setInitialState] = React.useState<readonly RichTextBlock[]>()
  const width = 500
  const height = 300
  const [target, setTarget] = React.useState<ReactRenderTarget<unknown>>(reactCanvasRenderTarget)
  const [autoHeight, setAutoHeight] = React.useState(false)
  const [readOnly, setReadOnly] = React.useState(false)
  const [html, setHtml] = React.useState('')

  React.useEffect(() => {
    (async () => {
      let json: RichTextBlock[]
      try {
        const res = await fetch(`https://storage.yorkyao.com/${key}`)
        json = await res.json()
      } catch {
        json = []
      }
      if (json.length === 0) {
        const r = produceWithPatches(json, draft => {
          draft.push({ type: 'p', blockStart: 0, blockEnd: 0, children: [] })
        })
        setInitialState(r[0])
        onApplyPatchesFromSelf(r[1], r[2])
      } else {
        setInitialState(json)
        setHtml(blocksToHtml(json))
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
  const onSendLocation = (location: [number, number]) => {
    if (ws.current && ws.current.readyState === ws.current.OPEN) {
      ws.current.send(JSON.stringify({ method: 'location', location, operator: me }))
    }
  }
  const editorRef = React.useRef<RichTextEditorRef | null>(null)
  React.useEffect(() => {
    if (!ws.current || !editorRef.current) {
      return
    }
    ws.current.onmessage = (data: MessageEvent<unknown>) => {
      if (editorRef.current && typeof data.data === 'string' && data.data) {
        const json = JSON.parse(data.data) as
          | { method: 'patch', operations: (Omit<Patch, 'path'> & { path: string })[], reversePatches: Patch[], operator: string }
          | { method: 'location', location: [number, number], operator: string }
        if (json.method === 'patch') {
          editorRef.current.handlePatchesEvent({
            ...json,
            patches: json.operations.map((p) => ({ ...p, path: p.path.substring(1).split('/') }))
          })
        } else if (json.method === 'location') {
          editorRef.current.handleLocationEvent(json)
        }
      }
    }
  }, [ws.current, editorRef.current])

  if (!initialState) {
    return null
  }
  return (
    <div>
      <div>
        {[reactCanvasRenderTarget, reactSvgRenderTarget].map((t) => (
          <label key={t.type}>
            <input type='radio' checked={target.type === t.type} onChange={() => setTarget(t)} />
            {t.type}
          </label>
        ))}
        <label>
          <input type='checkbox' checked={autoHeight} onChange={(e) => setAutoHeight(e.target.checked)} />
          autoHeight
        </label>
        <label>
          <input type='checkbox' checked={readOnly} onChange={(e) => setReadOnly(e.target.checked)} />
          readOnly
        </label>
      </div>
      <RichTextEditor
        ref={editorRef}
        initialState={initialState}
        width={width}
        height={height}
        onApplyPatchesFromSelf={onApplyPatchesFromSelf}
        onSendLocation={onSendLocation}
        onChange={(data) => setHtml(blocksToHtml(data.newState))}
        target={target}
        autoHeight={autoHeight}
        readOnly={readOnly}
        operator={me}
      />
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          width: width + 'px',
          height: height + 'px',
          margin: '10px',
          fontFamily: defaultFontFamily,
          overflowY: 'auto',
          border: '1px solid',
          fontSize: defaultFontSize + 'px',
        }}
      ></div>
    </div >
  )
}
