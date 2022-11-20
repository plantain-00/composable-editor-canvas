import React from "react"
import { metaKeyIfMacElseCtrlKey, ReactRenderTarget, usePatchBasedUndoRedo, useFlowLayoutBlockEditor, getTextSizeFromCache, getTextComposition, isWordCharactor, getWordByDoubleClick, FlowLayoutBlock, FlowLayoutBlockStyle } from "../../src"
import { NumberEditor, StringEditor, ObjectEditor, BooleanEditor, Button } from "react-composable-json-editor"
import { Patch } from "immer/dist/types/types-external"
import produce from "immer"
import { useAt } from "./at"

export const RichTextEditor = React.forwardRef((props: {
  initialState: readonly RichTextBlock[]
  width: number
  height: number
  onApplyPatchesFromSelf?: (patches: Patch[], reversePatches: Patch[]) => void
  onSendLocation?: (location: [number, number]) => void
  onChange?: (data: { newState: readonly RichTextBlock[] }) => void
  target: ReactRenderTarget<unknown>
  autoHeight: boolean
  readOnly: boolean
  operator: string
}, ref: React.ForwardedRef<RichTextEditorRef>) => {
  const { state, setState, undo, redo, applyPatchFromOtherOperators } = usePatchBasedUndoRedo(props.initialState, props.operator, {
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
    isSameType: (a, b) => a.type === b?.type,
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
  let decimalindex = 0
  layoutResult.forEach((r, blockIndex) => {
    const block = state[blockIndex]
    const first = r[0]
    const blockFontSize = block.fontSize ?? defaultFontSize
    const blockColor = block.color ?? 0x000000
    const blockFontFamily = block.fontFamily ?? defaultFontFamily
    decimalindex = block.listStyleType === 'decimal' ? decimalindex + 1 : 0
    if (block.listStyleType === 'disc') {
      const lineHeight = lineHeights[first.row]
      const radius = blockFontSize / 7
      children.push(props.target.renderCircle(first.x - blockFontSize + radius, first.y + lineHeight / 2, radius, { fillColor: blockColor, strokeWidth: 0 }))
    } else if (block.listStyleType === 'decimal') {
      const lineHeight = lineHeights[first.row]
      const offsetY = (lineHeightRatio - 1) / 2 / lineHeightRatio * lineHeight * 2
      children.push(props.target.renderText(first.x - blockFontSize + blockFontSize / 3, first.y - offsetY + lineHeight / lineHeightRatio, decimalindex + '.', blockColor, blockFontSize, blockFontFamily, { textAlign: 'right', }))
    }
    r.forEach(({ x, y, content, visible, row }, contentIndex) => {
      if (!visible) return
      const color = content.color ?? blockColor
      const backgroundColor = content.backgroundColor ?? block.backgroundColor
      const fontFamily = content.fontFamily ?? blockFontFamily
      const fontSize = content.fontSize ?? blockFontSize
      const textWidth = getTextWidth(content, block)
      const lineHeight = lineHeights[row]
      if (isSelected([blockIndex, contentIndex])) {
        children.push(props.target.renderRect(x, y, textWidth, lineHeight, { fillColor: 0xB3D6FD, strokeWidth: 0 }))
      }
      const offsetY = (lineHeightRatio - 1) / 2 / lineHeightRatio * lineHeight * 2
      if (backgroundColor !== undefined) {
        const textHeight = fontSize * lineHeightRatio
        children.push(props.target.renderRect(x, y + Math.max(lineHeight - offsetY - textHeight, 0), textWidth, textHeight, { fillColor: backgroundColor, strokeWidth: 0 }))
      }
      y -= offsetY
      const bold = content.bold || block.bold
      children.push(props.target.renderText(x + textWidth / 2, y + lineHeight / lineHeightRatio, content.text, color, fontSize, fontFamily, {
        textAlign: 'center',
        fontWeight: bold ? 'bold' : undefined,
        fontStyle: content.italic || block.italic ? 'italic' : undefined,
      }))
      const decorationThickness = bold ? 2.5 : 1
      if (content.underline || block.underline) {
        children.push(props.target.renderPolyline([{ x, y: y + lineHeight }, { x: x + textWidth, y: y + lineHeight }], { strokeColor: color, strokeWidth: decorationThickness }))
      }
      if (content.passThrough || block.passThrough) {
        const textHeight = fontSize
        children.push(props.target.renderPolyline([{ x, y: y + lineHeight - textHeight / 2 }, { x: x + textWidth, y: y + lineHeight - textHeight / 2 }], { strokeColor: color, strokeWidth: decorationThickness }))
      }
      const others = othersLocation.filter(c => c.location[0] === blockIndex && c.location[1] === contentIndex)
      if (others.length > 0) {
        children.push(
          props.target.renderRect(x, y, 2, lineHeight, { fillColor: 0xff0000, strokeWidth: 0 }),
          props.target.renderText(x, y + 12 + lineHeight, others.map(h => h.operator).join(','), 0xff0000, 12, fontFamily),
        )
      }
    })
  })
  const result = props.target.renderResult(children, props.width, actualHeight)

  const updateSelection = (recipe: (richText: Partial<RichTextStyle>) => void) => {
    if (range) {
      setState(draft => {
        for (let i = range.min[0]; i <= range.max[0]; i++) {
          const block = draft[i]
          const start = i === range.min[0] ? range.min[1] : 0
          const end = i === range.max[0] ? range.max[1] : block.children.length
          if (start === 0 && end === block.children.length) {
            recipe(block)
            continue
          }
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
      const fontSize = defaultFontSize * (block.fontSize ?? 1)
      b.blockStart = fontSize * (block.blockStart ?? 0)
      b.blockEnd = fontSize * (block.blockEnd ?? 0)
      b.inlineStart = block.inlineStart
      b.listStyleType = block.listStyleType
      b.bold = block.bold
      b.fontSize = fontSize
    }
    if (!range) {
      setState(draft => {
        const i = location[0]
        updateBlock(draft[i])
      })
      return
    }
    setState(draft => {
      const startBlockIndex = range.min[0]
      const endBlockIndex = range.max[0]
      for (let i = startBlockIndex; i <= endBlockIndex; i++) {
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

const lineHeightRatio = 1.2
export const defaultFontSize = 16
export const defaultFontFamily = 'monospace'

export interface RichText extends Partial<RichTextStyle> {
  text: string
}

export interface RichTextStyle {
  fontSize: number
  fontFamily: string
  bold: boolean
  italic: boolean
  underline: boolean
  passThrough: boolean
  color: number
  backgroundColor: number
}

export interface RichTextBlock extends FlowLayoutBlock<RichText>, Partial<RichTextStyle> {
  type: BlockType
}

const presetBlocks: Record<BlockType, Partial<RichTextStyle & FlowLayoutBlockStyle>> = {
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
    blockStart: 1,
    blockEnd: 1,
  },
  ul: {
    blockStart: 1,
    blockEnd: 1,
    inlineStart: 40,
    listStyleType: 'disc',
  },
  ol: {
    blockStart: 1,
    blockEnd: 1,
    inlineStart: 40,
    listStyleType: 'decimal',
  },
}
const presetBlockTypes = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "ul", "ol"] as const

type BlockType = typeof presetBlockTypes[number]

export interface RichTextEditorRef {
  handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }): void
  handleLocationEvent(data: { location: [number, number], operator: string }): void
}
