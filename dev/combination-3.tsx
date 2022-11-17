import React from "react"
import { metaKeyIfMacElseCtrlKey, reactCanvasRenderTarget, ReactRenderTarget, usePatchBasedUndoRedo, useFlowLayoutEditor, reactSvgRenderTarget, Position, getTextSizeFromCache, getTextComposition, isWordCharactor, getWordByDoubleClick } from "../src"
import { NumberEditor, StringEditor, ObjectEditor, BooleanEditor, Button } from "react-composable-json-editor"
import { setWsHeartbeat } from 'ws-heartbeat/client'
import { Patch } from "immer/dist/types/types-external"
import produce from "immer"

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)
const key = 'combination-3.json'

export function Combination3() {
  const [initialState, setInitialState] = React.useState<readonly RichText[]>()
  const width = 400
  const height = 200
  const [target, setTarget] = React.useState<ReactRenderTarget<unknown>>(reactCanvasRenderTarget)
  const [autoHeight, setAutoHeight] = React.useState(false)
  const [readOnly, setReadOnly] = React.useState(false)

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`https://storage.yorkyao.com/${key}`)
        const json: readonly RichText[] = await res.json()
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
        target={target}
        autoHeight={autoHeight}
        readOnly={readOnly}
      />
    </div>
  )
}

interface RichText {
  text: string
  fontSize: number
  fontFamily: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  passThrough?: boolean
  color?: number
  backgroundColor?: number
}

const lineHeightRatio = 1.2
const defaultFontSize = 16
const defaultFontFamily = 'monospace'

const RichTextEditor = React.forwardRef((props: {
  initialState: readonly RichText[]
  width: number
  height: number
  onApplyPatchesFromSelf?: (patches: Patch[], reversePatches: Patch[]) => void
  onSendLocation?: (location: number) => void
  target: ReactRenderTarget<unknown>
  autoHeight: boolean
  readOnly: boolean
}, ref: React.ForwardedRef<RichTextEditorRef>) => {
  const { state, setState, undo, redo, applyPatchFromOtherOperators } = usePatchBasedUndoRedo(props.initialState, me, {
    onApplyPatchesFromSelf: props.onApplyPatchesFromSelf,
  })

  const getTextWidth = (c: RichText) => getTextSizeFromCache(`${c.fontSize}px ${c.fontFamily}`, c.text)?.width ?? 0
  const getComposition = (index: number) => getTextComposition(index, state, getTextWidth, c => c.text)

  const { renderEditor, layoutResult, cursor, isSelected, actualHeight, lineHeights, inputContent, getCopiedContents, ref: editorRef, positionToLocation, getPosition, setSelectionStart, setLocation, range, location } = useFlowLayoutEditor({
    state,
    setState,
    width: props.width,
    height: props.height,
    lineHeight: c => c.fontSize * lineHeightRatio,
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
      if (e.key === 'Enter') {
        inputText('\n')
        return true
      }
      if (metaKeyIfMacElseCtrlKey(e)) {
        if (e.key === 'v') {
          paste()
          e.preventDefault()
          return true
        }
        if (e.key === 'c' || e.key === 'x') {
          const contents = getCopiedContents(e.key === 'x')
          if (contents) {
            // eslint-disable-next-line plantain/promise-not-await
            navigator.clipboard.writeText(JSON.stringify(contents))
          }
          return true
        }
      } else if (e.key.length === 1) {
        e.preventDefault()
        inputText(e.key)
        return true
      }
      return false
    },
    onLocationChanged: props.onSendLocation,
    autoHeight: props.autoHeight,
    getWidth: getTextWidth,
    isNewLineContent: content => content.text === '\n',
    isPartOfComposition: content => isWordCharactor(content.text),
    getComposition,
    endContent: { text: '', fontFamily: defaultFontFamily, fontSize: defaultFontSize },
    onCompositionEnd(e) {
      inputText(e.data)
      if (editorRef.current) {
        editorRef.current.value = ''
      }
    },
    onDoubleClick(e) {
      const p = positionToLocation(getPosition(e))
      const { newSelectionStart, newLocation } = getWordByDoubleClick(state, p, c => c.text)
      if (newSelectionStart !== undefined) setSelectionStart(newSelectionStart)
      if (newLocation !== undefined) setLocation(newLocation)
    },
    keepSelectionOnBlur: true,
  })
  let currentContent: RichText | undefined
  if (range) {
    currentContent = state[range.min]
  } else {
    currentContent = state[location - 1] ?? state[location]
  }
  const fontSize = currentContent ? currentContent.fontSize : defaultFontSize
  const fontFamily = currentContent ? currentContent.fontFamily : defaultFontFamily
  const bold = currentContent ? currentContent.bold : undefined
  const italic = currentContent ? currentContent.italic : undefined
  const underline = currentContent ? currentContent.underline : undefined
  const passThrough = currentContent ? currentContent.passThrough : undefined
  const color = currentContent ? currentContent.color : undefined
  const backgroundColor = currentContent ? currentContent.backgroundColor : undefined

  const inputText = (text: string | string[], textLocation = text.length) => {
    if (props.readOnly) return
    const result: RichText[] = []
    for (const t of text) {
      result.push({ text: t, fontFamily, fontSize, bold, italic, underline, passThrough, color, backgroundColor })
    }
    inputContent(result, textLocation)
  }
  const paste = () => {
    if (props.readOnly) return
    navigator.clipboard.readText().then(v => {
      if (v) {
        inputContent(JSON.parse(v))
      }
    })
  }

  const { processAtInput, suggestions, getRenderAtStyle } = useAt(cursor, lineHeights[cursor.row], inputText)
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

  const getTextColors = (i: number, content: RichText) => {
    let color = content.color
    let backgroundColor = content.backgroundColor
    const style = getRenderAtStyle(layoutResult[i].content.text)
    if (style) {
      color = style.color
      backgroundColor = style.backgroundColor
    }
    return { color, backgroundColor }
  }
  const children: unknown[] = []

  for (const { x, y, i, content, visible, row } of layoutResult) {
    if (!visible) continue
    const colors = getTextColors(i, content) ?? {}
    if (isSelected(i)) {
      colors.backgroundColor = 0xB3D6FD
    }
    const textWidth = getTextWidth(content)
    const lineHeight = lineHeights[row]
    if (colors.backgroundColor !== undefined) {
      children.push(props.target.renderRect(x, y, textWidth, lineHeight, { fillColor: colors.backgroundColor, strokeWidth: 0 }))
    }
    children.push(props.target.renderText(x + textWidth / 2, y + lineHeight / lineHeightRatio, content.text, colors.color ?? 0x000000, content.fontSize, content.fontFamily, {
      textAlign: 'center',
      fontWeight: content.bold ? 'bold' : undefined,
      fontStyle: content.italic ? 'italic' : undefined,
    }))
    if (content.underline) {
      children.push(props.target.renderPolyline([{ x, y: y + lineHeight }, { x: x + textWidth, y: y + lineHeight }], { strokeColor: colors.color ?? 0x000000 }))
    }
    if (content.passThrough) {
      children.push(props.target.renderPolyline([{ x, y: y + lineHeight / 2 }, { x: x + textWidth, y: y + lineHeight / 2 }], { strokeColor: colors.color ?? 0x000000 }))
    }
    const others = othersLocation.filter(c => c.location === i)
    if (others.length > 0) {
      children.push(
        props.target.renderRect(x, y, 2, lineHeight, { fillColor: 0xff0000, strokeWidth: 0 }),
        props.target.renderText(x, y + 12 + lineHeight, others.map(h => h.operator).join(','), 0xff0000, 12, content.fontFamily),
      )
    }
  }
  const result = props.target.renderResult(children, props.width, actualHeight)

  const updateSelection = (recipe: (richText: RichText) => void) => {
    if (range) {
      setState(draft => {
        for (let i = range.min; i < range.max; i++) {
          recipe(draft[i])
        }
      })
    }
  }
  const updateParagraph = (recipe: (richText: RichText) => void) => {
    let start = 0
    let end = state.length - 1
    for (let i = range?.min ?? location; i >= 0; i--) {
      if (state[i]?.text === '\n') {
        start = i + 1
        break
      }
    }
    for (let i = range?.max ?? location; i < state.length; i++) {
      if (state[i].text === '\n') {
        end = i
        break
      }
    }
    setState(draft => {
      for (let i = start; i <= end && i < state.length; i++) {
        recipe(draft[i])
      }
    })
  }

  return (
    <div style={{ position: 'relative', margin: '10px' }}>
      {renderEditor(result)}
      {suggestions}
      <ObjectEditor
        inline
        properties={{
          'font size': <NumberEditor value={fontSize} setValue={v => updateSelection(c => c.fontSize = v)} style={{ width: '50px' }} />,
          'font family': <StringEditor value={fontFamily} setValue={v => updateSelection(c => c.fontFamily = v)} style={{ width: '100px' }} />,
          bold: <BooleanEditor value={bold === true} setValue={v => updateSelection(c => c.bold = v ? true : undefined)} />,
          italic: <BooleanEditor value={italic === true} setValue={v => updateSelection(c => c.italic = v ? true : undefined)} />,
          underline: <BooleanEditor value={underline === true} setValue={v => updateSelection(c => c.underline = v ? true : undefined)} />,
          'pass through': <BooleanEditor value={passThrough === true} setValue={v => updateSelection(c => c.passThrough = v ? true : undefined)} />,
          color: <NumberEditor type='color' value={color ?? 0} setValue={v => updateSelection(c => c.color = v ? v : undefined)} />,
          'background color': <NumberEditor type='color' value={backgroundColor ?? 0} setValue={v => updateSelection(c => c.backgroundColor = v ? v : undefined)} />,
        }}
      />
      <Button onClick={() => updateParagraph(c => { c.bold = true; c.fontSize = defaultFontSize * 2 })} >h1</Button>
    </div>
  )
})

function useAt(cursor: Position, cursorHeight: number, inputText: (text: string[]) => void) {
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
        top: cursor.y + cursorHeight + 'px',
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
