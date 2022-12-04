import React from "react"
import { HtmlBlock } from "../src"
import { setWsHeartbeat } from 'ws-heartbeat/client'
import { Patch } from "immer/dist/types/types-external"
import { produceWithPatches } from "immer"
import { RichTextEditor, RichTextEditorPlugin, RichTextEditorRef } from "./rich-text-editor/rich-text-editor"
import { h1, h2, h3, h4, h5, h6, hr, ol, p, ul } from "./rich-text-editor/plugins/blocks"
import { backgroundColor, bold, color, fontFamily, fontSize, italic, passThrough, underline } from './rich-text-editor/plugins/styles'
import { useAt } from "./rich-text-editor/plugins/at"
import { link, useLink } from "./rich-text-editor/plugins/link"
import { image, useImage } from "./rich-text-editor/plugins/image"
import { code, mark, span, sub, sup } from "./rich-text-editor/plugins/inline"

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)
const key = 'combination-3.json'

export function Combination3() {
  const [initialState, setInitialState] = React.useState<readonly HtmlBlock[]>()
  const width = 500
  const height = 300
  const [autoHeight, setAutoHeight] = React.useState(true)
  const [readOnly, setReadOnly] = React.useState(false)
  const plugin = React.useRef<RichTextEditorPlugin>({
    blocks: { h1, h2, h3, h4, h5, h6, p, ul, ol, hr },
    styles: {
      'font size': fontSize,
      'font family': fontFamily,
      bold,
      italic,
      underline,
      'pass through': passThrough,
      color,
      'background color': backgroundColor,
    },
    hooks: [useAt, useLink, useImage],
    inlines: [link, image],
    textInlines: { span, code, mark, sub, sup },
  })

  React.useEffect(() => {
    (async () => {
      let json: HtmlBlock[]
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
  const onSendLocation = (location?: [number, number]) => {
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
        autoHeight={autoHeight}
        readOnly={readOnly}
        operator={me}
        plugin={plugin.current}
      />
    </div >
  )
}
