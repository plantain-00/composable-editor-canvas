import React from "react"
import { metaKeyIfMacElseCtrlKey, reactCanvasRenderTarget, ReactRenderTarget, usePatchBasedUndoRedo, useFlowLayoutBlockEditor, reactSvgRenderTarget, Position, getTextSizeFromCache, getTextComposition, isWordCharactor, getWordByDoubleClick, FlowLayoutBlock, getColorString, Merger } from "../src"
import { NumberEditor, StringEditor, ObjectEditor, BooleanEditor, Button } from "react-composable-json-editor"
import { setWsHeartbeat } from 'ws-heartbeat/client'
import { Patch } from "immer/dist/types/types-external"
import produce, { produceWithPatches } from "immer"

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

interface RichText extends Partial<RichTextStyle> {
  text: string
}

interface RichTextStyle {
  fontSize: number
  fontFamily: string
  bold: boolean
  italic: boolean
  underline: boolean
  passThrough: boolean
  color: number
  backgroundColor: number
}

interface RichTextBlock extends FlowLayoutBlock<RichText>, Partial<RichTextStyle> {
  type: BlockType
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
  onChange?: (data: { newState: readonly RichTextBlock[] }) => void
  target: ReactRenderTarget<unknown>
  autoHeight: boolean
  readOnly: boolean
}, ref: React.ForwardedRef<RichTextEditorRef>) => {
  const { state, setState, undo, redo, applyPatchFromOtherOperators } = usePatchBasedUndoRedo(props.initialState, me, {
    onApplyPatchesFromSelf: props.onApplyPatchesFromSelf,
    onChange: props.onChange,
  })

  const getTextWidth = (c: RichText, b: RichTextBlock) => getTextSizeFromCache(`${c.fontSize ?? b.fontSize ?? defaultFontSize}px ${c.fontFamily ?? b.fontFamily ?? defaultFontFamily}`, c.text)?.width ?? 0
  const getComposition = (blockIndex: number, index: number) => getTextComposition(index, state[blockIndex].children, c => getTextWidth(c, state[blockIndex]), c => c.text)

  const { renderEditor, layoutResult, cursor, isSelected, actualHeight, lineHeights, inputContent, getCopiedContents, ref: editorRef, positionToLocation, getPosition, setSelectionStart, setLocation, range, location } = useFlowLayoutBlockEditor({
    state,
    setState,
    width: props.width,
    height: props.height,
    lineHeight: (c, b) => (c.fontSize ?? b.fontSize ?? defaultFontSize) * lineHeightRatio,
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
    endContent: { text: '' },
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
  let currentBlock: RichTextBlock | undefined
  if (range) {
    currentBlock = state[range.min[0]]
    currentContent = currentBlock.children[range.min[1]]
  } else {
    currentBlock = state[location[0]]
    if (currentBlock) {
      currentContent = currentBlock.children[location[1]] ?? currentBlock.children[currentBlock.children.length - 1]
    }
  }

  const inputText = (text: string | (string | RichText)[]) => {
    if (props.readOnly) return
    const result: RichText[] = []
    for (const t of text) {
      if (typeof t === 'string') {
        result.push({ ...currentContent, text: t })
      } else {
        result.push({ ...currentContent, ...t })
      }
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
            children: v.split('').map(s => ({ text: s })),
            blockStart: 0,
            blockEnd: 0,
            type: 'p',
          }])
        }
      }
    })
  }

  const { processAtInput, suggestions } = useAt(cursor, lineHeights[cursor.row], inputText)
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

  const children: unknown[] = []
  layoutResult.forEach((r, blockIndex) => {
    r.forEach(({ x, y, content, visible, row }, contentIndex) => {
      if (!visible) return
      const block = state[blockIndex]
      const color = content.color ?? block.color ?? 0x000000
      let backgroundColor = content.backgroundColor ?? block.backgroundColor
      if (isSelected([blockIndex, contentIndex])) {
        backgroundColor = 0xB3D6FD
      }
      const textWidth = getTextWidth(content, block)
      const lineHeight = lineHeights[row]
      if (backgroundColor !== undefined) {
        children.push(props.target.renderRect(x, y, textWidth, lineHeight, { fillColor: backgroundColor, strokeWidth: 0 }))
      }
      const bold = content.bold || block.bold
      children.push(props.target.renderText(x + textWidth / 2, y + lineHeight / lineHeightRatio, content.text, color, content.fontSize ?? block.fontSize ?? defaultFontSize, content.fontFamily ?? block.fontFamily ?? defaultFontFamily, {
        textAlign: 'center',
        fontWeight: bold ? 'bold' : undefined,
        fontStyle: content.italic || block.italic ? 'italic' : undefined,
      }))
      const decorationThickness = bold ? 2.5 : 1
      if (content.underline || block.underline) {
        children.push(props.target.renderPolyline([{ x, y: y + lineHeight }, { x: x + textWidth, y: y + lineHeight }], { strokeColor: color, strokeWidth: decorationThickness }))
      }
      if (content.passThrough || block.passThrough) {
        children.push(props.target.renderPolyline([{ x, y: y + lineHeight / 2 }, { x: x + textWidth, y: y + lineHeight / 2 }], { strokeColor: color, strokeWidth: decorationThickness }))
      }
      const others = othersLocation.filter(c => c.location[0] === blockIndex && c.location[1] === contentIndex)
      if (others.length > 0) {
        children.push(
          props.target.renderRect(x, y, 2, lineHeight, { fillColor: 0xff0000, strokeWidth: 0 }),
          props.target.renderText(x, y + 12 + lineHeight, others.map(h => h.operator).join(','), 0xff0000, 12, content.fontFamily ?? block.fontFamily ?? defaultFontFamily),
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
  const updateParagraph = (type: BlockType) => {
    const updateBlock = (b: RichTextBlock) => {
      b.type = type
      const block = presetBlocks[type]
      b.blockStart = defaultFontSize * block.fontSize * block.blockStart
      b.blockEnd = defaultFontSize * block.fontSize * block.blockEnd
      b.bold = block.bold
      b.fontSize = defaultFontSize * block.fontSize
    }
    if (!range) {
      setState(draft => {
        updateBlock(draft[location[0]])
      })
      return
    }
    setState(draft => {
      for (let i = range.min[0]; i <= range.max[0]; i++) {
        updateBlock(draft[i])
      }
    })
  }

  return (
    <div style={{ position: 'relative', margin: '10px' }}>
      <div style={{ display: 'flex' }}>
        {renderEditor(result)}
        <ObjectEditor
          inline
          properties={{
            'font size': <NumberEditor value={currentContent?.fontSize ?? currentBlock?.fontSize ?? defaultFontSize} setValue={v => updateSelection(c => c.fontSize = v)} style={{ width: '50px' }} />,
            'font family': <StringEditor value={currentContent?.fontFamily ?? currentBlock?.fontFamily ?? defaultFontFamily} setValue={v => updateSelection(c => c.fontFamily = v)} style={{ width: '100px' }} />,
            bold: <BooleanEditor value={(currentContent?.bold ?? currentBlock?.bold) === true} setValue={v => updateSelection(c => c.bold = v ? true : undefined)} />,
            italic: <BooleanEditor value={(currentContent?.italic ?? currentBlock?.italic) === true} setValue={v => updateSelection(c => c.italic = v ? true : undefined)} />,
            underline: <BooleanEditor value={(currentContent?.underline ?? currentBlock?.underline) === true} setValue={v => updateSelection(c => c.underline = v ? true : undefined)} />,
            'pass through': <BooleanEditor value={(currentContent?.passThrough ?? currentBlock?.passThrough) === true} setValue={v => updateSelection(c => c.passThrough = v ? true : undefined)} />,
            color: <NumberEditor type='color' value={currentContent?.color ?? currentBlock?.color ?? 0} setValue={v => updateSelection(c => c.color = v ? v : undefined)} />,
            'background color': <NumberEditor type='color' value={currentContent?.backgroundColor ?? currentBlock?.backgroundColor ?? 0xffffff} setValue={v => updateSelection(c => c.backgroundColor = v ? v : undefined)} />,
            block: <div>{presetBlockTypes.map(t => <Button key={t} style={{ fontWeight: state[location[0]]?.type === t ? 'bold' : undefined }} onClick={() => updateParagraph(t)}>{t}</Button>)}</div>
          }}
        />
      </div>
      {suggestions}
    </div>
  )
})

const presetBlocks = {
  h1: {
    fontSize: 2,
    bold: true,
    blockStart: 0.67,
    blockEnd: 0.67,
  },
  h2: {
    fontSize: 1.5,
    bold: true,
    blockStart: 0.83,
    blockEnd: 0.83,
  },
  h3: {
    fontSize: 1.17,
    bold: true,
    blockStart: 1.17,
    blockEnd: 1.17,
  },
  h4: {
    fontSize: 1,
    bold: true,
    blockStart: 1,
    blockEnd: 1,
  },
  h5: {
    fontSize: 0.83,
    bold: true,
    blockStart: 1,
    blockEnd: 1,
  },
  h6: {
    fontSize: 0.67,
    bold: true,
    blockStart: 2.33,
    blockEnd: 2.33,
  },
  p: {
    fontSize: 1,
    bold: undefined,
    blockStart: 1,
    blockEnd: 1,
  },
}
const getKeys: <T>(obj: T) => (keyof T)[] = Object.keys
const presetBlockTypes = getKeys(presetBlocks)

type BlockType = keyof typeof presetBlocks

function blocksToHtml(blocks: readonly RichTextBlock[]) {
  return blocks.map(b => {
    let children = ''
    const merger = new Merger<RichText, string>(
      last => children += `<span style="${richTextStyleToHtmlStyle(last.type)}">${last.target.join('')}</span>`,
      (a, b) => a.backgroundColor === b.backgroundColor &&
        a.bold === b.bold &&
        a.color === b.color &&
        a.fontFamily === b.fontFamily &&
        a.fontSize === b.fontSize &&
        a.italic === b.italic &&
        a.passThrough === b.passThrough &&
        a.underline === b.underline,
      a => a.text,
    )
    b.children.forEach(c => merger.push(c))
    merger.flushLast()
    let style = richTextStyleToHtmlStyle(b)
    if (b.blockStart) style += `margin-block-start: ${b.blockStart}px;`
    if (b.blockEnd) style += `margin-block-end: ${b.blockEnd}px;`
    return `<${b.type} style="${style}">${children}</${b.type}>`
  }).join('')
}

function richTextStyleToHtmlStyle(c: Partial<RichTextStyle>) {
  let style = ''
  if (c.backgroundColor !== undefined) style += `background-color: ${getColorString(c.backgroundColor)};`
  if (c.bold) style += 'font-weight: bold;'
  if (c.color !== undefined) style += `color: ${getColorString(c.color)};`
  if (c.fontFamily) style += `font-family: ${c.fontFamily};`
  if (c.fontSize) style += `font-size: ${c.fontSize}px;`
  if (c.italic) style += `font-style: italic;`
  const textDecorations: string[] = []
  if (c.passThrough) textDecorations.push('line-through')
  if (c.underline) textDecorations.push('underline')
  if (textDecorations.length > 0) style += `text-decoration: ${textDecorations.join(' ')};`
  return style
}

function useAt(cursor: Position, cursorHeight: number, inputText: (text: (string | RichText)[]) => void) {
  const [at, setAt] = React.useState('')
  const [atIndex, setAtIndex] = React.useState(0)
  const style = {
    color: 0xffffff,
    backgroundColor: 0x0000ff,
  }

  return {
    processAtInput(e: React.KeyboardEvent<HTMLInputElement>) {
      if (at) {
        if (e.key.length === 1 && e.key >= 'a' && e.key <= 'z') {
          setAt(a => a + e.key)
          e.preventDefault()
          return true
        }
        if (e.key === 'Enter' && at) {
          inputText([{ text: at + '_' + atIndex, ...style }, ' '])
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
          inputText([{ text: at + '_' + i, ...style }, ' '])
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
