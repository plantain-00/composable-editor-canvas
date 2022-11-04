import React from "react"
import { metaKeyIfMacElseCtrlKey, reactCanvasRenderTarget, ReactRenderTarget, usePatchBasedUndoRedo, useFlowLayoutCursor, reactSvgRenderTarget } from "../src"
import { setWsHeartbeat } from 'ws-heartbeat/client'
import { Patch } from "immer/dist/types/types-external"
import produce from "immer"

interface CharacterContent {
  type: 'text'
  text: string
  width: number
}

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)
const key = 'combination-3.json'

export default () => {
  const [initialState, setInitialState] = React.useState<readonly CharacterContent[]>()
  const fontSize = 20
  const fontFamily = 'monospace'
  const width = 400
  const height = 200
  const [target, setTarget] = React.useState<ReactRenderTarget<unknown>>(reactCanvasRenderTarget)

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`https://storage.yorkyao.com/${key}`)
        const json: readonly CharacterContent[] = await res.json()
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
  const onSendLocation = (location: number) => {
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
          | { method: 'location', location: number, operator: string }
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
      <textarea
        spellCheck={false}
        style={{
          fontSize: fontSize + 'px',
          fontFamily,
          width: width + 'px',
          height: height + 'px',
          padding: '2px',
        }}
        defaultValue={initialState.map(s => s.text).join('')}
      />
      <div>
        {[reactCanvasRenderTarget, reactSvgRenderTarget].map((t) => (
          <span key={t.type}>
            <input type='checkbox' checked={target.type === t.type} id={t.type} onChange={(e) => e.target.checked ? setTarget(t) : undefined} />
            <label htmlFor={t.type}>{t.type}</label>
          </span>
        ))}
      </div>
      <RichTextEditor
        ref={editorRef}
        initialState={initialState}
        width={width}
        height={height}
        fontSize={fontSize}
        fontFamily={fontFamily}
        onApplyPatchesFromSelf={onApplyPatchesFromSelf}
        onSendLocation={onSendLocation}
        target={target}
      />
    </div>
  )
}

const RichTextEditor = React.forwardRef((props: {
  initialState: readonly CharacterContent[]
  width: number
  height: number
  fontSize: number
  fontFamily: string
  onApplyPatchesFromSelf?: (patches: Patch[], reversePatches: Patch[]) => void
  onSendLocation?: (location: number) => void
  target: ReactRenderTarget<unknown>
}, ref: React.ForwardedRef<RichTextEditorRef>) => {
  const lineHeight = props.fontSize * 1.2
  const { state, setState, undo, redo, applyPatchFromOtherOperators } = usePatchBasedUndoRedo(props.initialState, me, {
    onApplyPatchesFromSelf: props.onApplyPatchesFromSelf,
  })
  const { container, isSelected, layoutResult } = useFlowLayoutCursor({
    state,
    setState,
    width: props.width,
    height: props.height,
    fontSize: props.fontSize,
    fontFamily: props.fontFamily,
    lineHeight,
    getTextContent: (text, width) => ({ text, width, type: 'text' as const }),
    processInput(e) {
      if (metaKeyIfMacElseCtrlKey(e)) {
        if (e.key === 'z') {
          // eslint-disable-next-line plantain/promise-not-await
          e.shiftKey ? redo() : undo()
          return true
        }
      }
      return false
    },
    onLocationChanged: props.onSendLocation,
  })
  const [othersLocation, setOthersLocation] = React.useState<{ location: number, operator: string }[]>([])

  React.useImperativeHandle<RichTextEditorRef, RichTextEditorRef>(ref, () => ({
    handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }) {
      try {
        applyPatchFromOtherOperators(data.patches, data.reversePatches, data.operator)
      } catch (error) {
        console.error(error)
      }
    },
    handleLocationEvent(data: { location: number, operator: string }) {
      setOthersLocation(produce(othersLocation, (draft) => {
        const index = othersLocation.findIndex((s) => s.operator === data.operator)
        if (index >= 0) {
          if (data.location >= 0 && data.location <= state.length) {
            draft[index].location = data.location
          } else {
            draft.splice(index, 1)
          }
        } else {
          draft.push({ location: data.location, operator: data.operator })
        }
      }))
    },
  }), [applyPatchFromOtherOperators])

  const target = props.target
  const children: unknown[] = []
  for (const { x, y, i, content } of layoutResult) {
    if (isSelected(i)) {
      children.push(target.renderRect(x, y, content.width, lineHeight, { fillColor: 0xB3D6FD, strokeWidth: 0 }))
    }
    const others = othersLocation.filter(c => c.location === i)
    if (others.length > 0) {
      children.push(
        target.renderRect(x, y, 2, lineHeight, { fillColor: 0xff0000, strokeWidth: 0 }),
        target.renderText(x, y + 12 + lineHeight, others.map(h => h.operator).join(','), 0xff0000, 12, props.fontFamily),
      )
    }
    children.push(target.renderText(x + content.width / 2, y + props.fontSize, content.text, 0x000000, props.fontSize, props.fontFamily, { textAlign: 'center' }))
  }
  const result = target.renderResult(children, props.width, props.height)
  return container(result)
})

export interface RichTextEditorRef {
  handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }): void
  handleLocationEvent(data: { location: number, operator: string }): void
}
