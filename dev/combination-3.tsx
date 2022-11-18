import React from "react"
import { metaKeyIfMacElseCtrlKey, reactCanvasRenderTarget, ReactRenderTarget, usePatchBasedUndoRedo, useFlowLayoutBlockEditor, reactSvgRenderTarget, Position, getTextSizeFromCache, getTextComposition, isWordCharactor, getWordByDoubleClick, FlowLayoutBlock } from "../src"
import { NumberEditor, StringEditor, ObjectEditor, BooleanEditor, Button } from "react-composable-json-editor"
import { setWsHeartbeat } from 'ws-heartbeat/client'
import { Patch } from "immer/dist/types/types-external"
import produce, { produceWithPatches } from "immer"

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)
const key = 'combination-3.json'

export function Combination3() {
  const [initialState, setInitialState] = React.useState<readonly RichTextBlock[]>()
  const width = 500
  const height = 400
  const [target, setTarget] = React.useState<ReactRenderTarget<unknown>>(reactCanvasRenderTarget)
  const [autoHeight, setAutoHeight] = React.useState(false)
  const [readOnly, setReadOnly] = React.useState(false)

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

interface RichTextBlock extends FlowLayoutBlock<RichText> {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p'
}

const lineHeightRatio = 1.2
const defaultFontSize = 16
const defaultFontFamily = 'monospace'

const RichTextEditor = React.forwardRef((props: {
  initialState: readonly RichTextBlock[]
  width: number
  height: number
  onApplyPatchesFromSelf?: (patches: Patch[], reversePatches: Patch[]) => void
  onSendLocation?: (location: [number, number]) => void
  target: ReactRenderTarget<unknown>
  autoHeight: boolean
  readOnly: boolean
}, ref: React.ForwardedRef<RichTextEditorRef>) => {
  const { state, setState, undo, redo, applyPatchFromOtherOperators } = usePatchBasedUndoRedo(props.initialState, me, {
    onApplyPatchesFromSelf: props.onApplyPatchesFromSelf,
  })

  const getTextWidth = (c: RichText) => getTextSizeFromCache(`${c.fontSize}px ${c.fontFamily}`, c.text)?.width ?? 0
  const getComposition = (blockIndex: number, index: number) => getTextComposition(index, state[blockIndex].children, getTextWidth, c => c.text)

  const { renderEditor, layoutResult, cursor, isSelected, actualHeight, lineHeights, inputContent, getCopiedContents, ref: editorRef, positionToLocation, getPosition, setSelectionStart, setLocation, range, location } = useFlowLayoutBlockEditor({
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
      const [blockIndex, contentIndex] = positionToLocation(getPosition(e))
      const { newSelectionStart, newLocation } = getWordByDoubleClick(state[blockIndex].children, contentIndex, c => c.text)
      if (newSelectionStart !== undefined) setSelectionStart([blockIndex, newSelectionStart])
      if (newLocation !== undefined) setLocation([blockIndex, newLocation])
    },
    keepSelectionOnBlur: true,
  })
  let currentContent: RichText | undefined
  if (range) {
    currentContent = state[range.min[0]].children[range.min[1]]
  } else {
    const block = state[location[0]]
    if (block) {
      currentContent = block.children[location[1]] ?? block.children[block.children.length - 1]
    }
  }
  const fontSize = currentContent ? currentContent.fontSize : defaultFontSize
  const fontFamily = currentContent ? currentContent.fontFamily : defaultFontFamily
  const bold = currentContent ? currentContent.bold : undefined
  const italic = currentContent ? currentContent.italic : undefined
  const underline = currentContent ? currentContent.underline : undefined
  const passThrough = currentContent ? currentContent.passThrough : undefined
  const color = currentContent ? currentContent.color : undefined
  const backgroundColor = currentContent ? currentContent.backgroundColor : undefined

  const inputText = (text: string | string[]) => {
    if (props.readOnly) return
    const result: RichText[] = []
    for (const t of text) {
      result.push({ text: t, fontFamily, fontSize, bold, italic, underline, passThrough, color, backgroundColor })
    }
    inputContent([{ children: result, type: 'p', blockStart: 0, blockEnd: 0 }])
  }
  const paste = () => {
    if (props.readOnly) return
    navigator.clipboard.readText().then(v => {
      if (v) {
        try {
          inputContent(JSON.parse(v))
        } catch {
          inputContent([{
            children: v.split('').map(s => ({ text: s, fontSize: defaultFontSize, fontFamily: defaultFontFamily })),
            blockStart: 0,
            blockEnd: 0,
            type: 'p',
          }])
        }
      }
    })
  }

  const { processAtInput, suggestions, getRenderAtStyle } = useAt(cursor, lineHeights[cursor.row], inputText)
  const [othersLocation, setOthersLocation] = React.useState<{ location: [number, number], operator: string }[]>([])

  React.useImperativeHandle<RichTextEditorRef, RichTextEditorRef>(ref, () => ({
    handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }) {
      try {
        applyPatchFromOtherOperators(data.patches, data.reversePatches, data.operator)
      } catch (error) {
        console.error(error)
      }
    },
    handleLocationEvent(data: { location: [number, number], operator: string }) {
      setOthersLocation(produce(othersLocation, (draft) => {
        const index = othersLocation.findIndex((s) => s.operator === data.operator)
        if (index >= 0) {
          const block = state[data.location[0]]
          if (block && block.children[data.location[1]]) {
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

  const getTextColors = (blockIndex: number, contentIndex: number, content: RichText) => {
    let color = content.color
    let backgroundColor = content.backgroundColor
    const style = getRenderAtStyle(layoutResult[blockIndex][contentIndex].content.text)
    if (style) {
      color = style.color
      backgroundColor = style.backgroundColor
    }
    return { color, backgroundColor }
  }
  const children: unknown[] = []

  layoutResult.forEach((r, blockIndex) => {
    r.forEach(({ x, y, content, visible, row }, contentIndex) => {
      if (!visible) return
      const colors = getTextColors(blockIndex, contentIndex, content) ?? {}
      if (isSelected([blockIndex, contentIndex])) {
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
      const others = othersLocation.filter(c => c.location[0] === blockIndex && c.location[1] === contentIndex)
      if (others.length > 0) {
        children.push(
          props.target.renderRect(x, y, 2, lineHeight, { fillColor: 0xff0000, strokeWidth: 0 }),
          props.target.renderText(x, y + 12 + lineHeight, others.map(h => h.operator).join(','), 0xff0000, 12, content.fontFamily),
        )
      }
    })
  })
  const result = props.target.renderResult(children, props.width, actualHeight)

  const updateSelection = (recipe: (richText: RichText) => void) => {
    if (range) {
      setState(draft => {
        for (let i = range.min[0]; i <= range.max[0]; i++) {
          const block = draft[i]
          const start = i === range.min[0] ? range.min[1] : 0
          const end = i === range.max[0] ? range.max[1] : block.children.length
          for (let j = start; j < end; j++) {
            recipe(block.children[j])
          }
        }
      })
    }
  }
  const updateParagraph = (type: RichTextBlock['type']) => {
    const updateBlock = (b: RichTextBlock) => {
      b.type = type
      if (type === 'h1') {
        b.blockStart = defaultFontSize * 2 * 0.67
        b.blockEnd = defaultFontSize * 2 * 0.67
      } else if (type === 'h2') {
        b.blockStart = defaultFontSize * 1.5 * 0.83
        b.blockEnd = defaultFontSize * 1.5 * 0.83
      } else if (type === 'h3') {
        b.blockStart = defaultFontSize * 1.17
        b.blockEnd = defaultFontSize * 1.17
      } else if (type === 'h4') {
        b.blockStart = defaultFontSize
        b.blockEnd = defaultFontSize
      } else if (type === 'h5') {
        b.blockStart = defaultFontSize * 0.83
        b.blockEnd = defaultFontSize * 0.83
      } else if (type === 'h6') {
        b.blockStart = defaultFontSize * 0.67 * 2.33
        b.blockEnd = defaultFontSize * 0.67 * 2.33
      } else if (type === 'p') {
        b.blockStart = defaultFontSize * 0.3
        b.blockEnd = defaultFontSize * 0.3
      }
    }
    const updateText = (c: RichText) => {
      c.bold = true
      if (type === 'h1') {
        c.fontSize = defaultFontSize * 2
      } else if (type === 'h2') {
        c.fontSize = defaultFontSize * 1.5
      } else if (type === 'h3') {
        c.fontSize = defaultFontSize * 1.17
      } else if (type === 'h4') {
        c.fontSize = defaultFontSize
      } else if (type === 'h5') {
        c.fontSize = defaultFontSize * 0.83
      } else if (type === 'h6') {
        c.fontSize = defaultFontSize * 0.67
      } else if (type === 'p') {
        c.fontSize = defaultFontSize
        c.bold = false
      }
    }
    if (!range) {
      setState(draft => {
        const block = draft[location[0]]
        updateBlock(block)
        for (const text of block.children) {
          updateText(text)
        }
      })
      return
    }
    setState(draft => {
      for (let i = range.min[0]; i <= range.max[0]; i++) {
        const block = draft[i]
        updateBlock(block)
        for (const text of block.children) {
          updateText(text)
        }
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
      {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'] as const).map(t => <Button key={t} onClick={() => updateParagraph(t)}>{t}</Button>)}
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
  handleLocationEvent(data: { location: [number, number], operator: string }): void
}
