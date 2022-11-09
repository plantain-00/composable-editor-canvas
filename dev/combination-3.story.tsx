import React from "react"
import { metaKeyIfMacElseCtrlKey, reactCanvasRenderTarget, ReactRenderTarget, usePatchBasedUndoRedo, useFlowLayoutTextEditor, reactSvgRenderTarget, Position } from "../src"
import { setWsHeartbeat } from 'ws-heartbeat/client'
import { Patch } from "immer/dist/types/types-external"
import produce from "immer"

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)
const key = 'combination-3.json'

export default () => {
  const [initialState, setInitialState] = React.useState<readonly string[]>()
  const fontSize = 20
  const fontFamily = 'monospace'
  const width = 400
  const height = 200
  const [target, setTarget] = React.useState<ReactRenderTarget<unknown>>(reactCanvasRenderTarget)
  const [autoHeight, setAutoHeight] = React.useState(false)
  const [readOnly, setReadOnly] = React.useState(false)

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`https://storage.yorkyao.com/${key}`)
        const json: readonly string[] = await res.json()
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
          resize: 'none',
        }}
        readOnly={readOnly}
        defaultValue={initialState.join('')}
      />
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
        fontSize={fontSize}
        fontFamily={fontFamily}
        onApplyPatchesFromSelf={onApplyPatchesFromSelf}
        onSendLocation={onSendLocation}
        target={target}
        autoHeight={autoHeight}
        readOnly={readOnly}
      />
    </div>
  )
}

const RichTextEditor = React.forwardRef((props: {
  initialState: readonly string[]
  width: number
  height: number
  fontSize: number
  fontFamily: string
  onApplyPatchesFromSelf?: (patches: Patch[], reversePatches: Patch[]) => void
  onSendLocation?: (location: number) => void
  target: ReactRenderTarget<unknown>
  autoHeight: boolean
  readOnly: boolean
}, ref: React.ForwardedRef<RichTextEditorRef>) => {
  const lineHeight = props.fontSize * 1.2
  const { state, setState, undo, redo, applyPatchFromOtherOperators } = usePatchBasedUndoRedo(props.initialState, me, {
    onApplyPatchesFromSelf: props.onApplyPatchesFromSelf,
  })
  const { renderEditor, layoutResult, cursor, inputText } = useFlowLayoutTextEditor({
    state,
    setState,
    width: props.width,
    height: props.height,
    fontSize: props.fontSize,
    fontFamily: props.fontFamily,
    lineHeight,
    readOnly: props.readOnly,
    processInput(e) {
      if (processAtInput(e)) {
        return true
      }
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
    autoHeight: props.autoHeight,
  })
  const { processAtInput, suggestions, getRenderAtStyle } = useAt(cursor, lineHeight, inputText)
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

  const getTextColors = (i: number) => {
    let color: number | undefined
    let backgroundColor: number | undefined
    const style = getRenderAtStyle(layoutResult[i].content)
    if (style) {
      color = style.color
      backgroundColor = style.backgroundColor
    }
    return { color, backgroundColor }
  }
  const children: unknown[] = []
  for (const { x, y, i, visible } of layoutResult) {
    if (!visible) continue
    const others = othersLocation.filter(c => c.location === i)
    if (others.length > 0) {
      children.push(
        props.target.renderRect(x, y, 2, lineHeight, { fillColor: 0xff0000, strokeWidth: 0 }),
        props.target.renderText(x, y + 12 + lineHeight, others.map(h => h.operator).join(','), 0xff0000, 12, props.fontFamily),
      )
    }
  }
  return (
    <div style={{ position: 'relative' }}>
      {renderEditor({ target: props.target, getTextColors, children })}
      {suggestions}
    </div>
  )
})

function useAt(cursor: Position, lineHeight: number, inputText: (text: string[]) => void) {
  const [at, setAt] = React.useState('')
  const [atIndex, setAtIndex] = React.useState(0)

  return {
    getRenderAtStyle(text: string) {
      if (text.length > 1 && text.startsWith('@')) {
        return {
          color: 0xffffff,
          backgroundColor: 0x0000ff,
        }
      }
      return
    },
    processAtInput(e: React.KeyboardEvent<HTMLInputElement>) {
      if (at) {
        if (e.key.length === 1 && e.key >= 'a' && e.key <= 'z') {
          setAt(a => a + e.key)
          e.preventDefault()
          return true
        }
        if (e.key === 'Enter' && at) {
          inputText([at + '_' + atIndex, ' '])
          setAt('')
          return true
        }
        if (e.key === 'Escape') {
          setAt('')
          e.preventDefault()
          return true
        }
        if (e.key === 'ArrowDown') {
          setAtIndex((atIndex + 1) % 5)
          e.preventDefault()
          return true
        }
        if (e.key === 'ArrowUp') {
          setAtIndex((atIndex + 4) % 5)
          e.preventDefault()
          return true
        }
        if (e.key === 'Backspace') {
          if (at.length > 1) {
            setAt(a => a.slice(0, a.length - 1))
          } else {
            setAt('')
          }
          e.preventDefault()
          return true
        }
      }
      if (e.key === '@') {
        setAt('@')
        e.preventDefault()
        return true
      }
      return false
    },
    suggestions: at && <div
      style={{
        position: 'absolute',
        left: cursor.x + 'px',
        top: cursor.y + lineHeight + 'px',
        background: 'white',
        width: '100px',
        border: '1px solid black',
      }}
    >
      <div>{at}</div>
      {new Array<number>(5).fill(0).map((_, i) => <div
        key={i}
        style={{ background: atIndex === i ? '#ccc' : undefined }}
        onMouseDown={(e) => {
          e.preventDefault()
          inputText([at + '_' + i, ' '])
          setAt('')
        }}
      >
        {at + '_' + i}
      </div>)}
    </div>,
  }
}

export interface RichTextEditorRef {
  handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }): void
  handleLocationEvent(data: { location: number, operator: string }): void
}
