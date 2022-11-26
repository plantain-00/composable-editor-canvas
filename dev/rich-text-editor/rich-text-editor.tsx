import React from "react"
import { metaKeyIfMacElseCtrlKey, ReactRenderTarget, usePatchBasedUndoRedo, useFlowLayoutBlockEditor, getTextSizeFromCache, getTextComposition, isWordCharactor, getWordByDoubleClick, getKeys } from "../../src"
import { ObjectEditor, Button } from "react-composable-json-editor"
import { Patch } from "immer/dist/types/types-external"
import produce from "immer"
import { BlockType, defaultFontFamily, defaultFontSize, isText, lineHeightRatio, RichText, RichTextBlock, RichTextEditorPluginBlock, RichTextEditorPluginHook, RichTextEditorPluginInline, RichTextEditorPluginStyle, RichTextEditorPluginTextInline, RichTextInline, RichTextStyle } from "./model"
import { blocksToHtml } from "./export-to-html"

export const RichTextEditor = React.forwardRef((props: {
  initialState: readonly RichTextBlock[]
  width: number
  height: number
  onApplyPatchesFromSelf?: (patches: Patch[], reversePatches: Patch[]) => void
  onSendLocation?: (location: [number, number]) => void
  onExport?: (html: string) => void
  target: ReactRenderTarget<unknown>
  autoHeight: boolean
  readOnly: boolean
  operator: string
  plugin?: RichTextEditorPlugin
  useHtml?: boolean
}, ref: React.ForwardedRef<RichTextEditorRef>) => {
  const { state, setState, undo, redo, applyPatchFromOtherOperators } = usePatchBasedUndoRedo(props.initialState, props.operator, {
    onApplyPatchesFromSelf: props.onApplyPatchesFromSelf,
  })
  const [html, setHtml] = React.useState('')

  const getWidth = (c: RichTextInline, b: RichTextBlock) => {
    if (isText(c)) return getTextSizeFromCache(`${c.fontSize ?? b.fontSize ?? defaultFontSize}px ${c.fontFamily ?? b.fontFamily ?? defaultFontFamily}`, c.text)?.width ?? 0
    if (props.plugin?.inlines) {
      for (const inline of props.plugin.inlines) {
        const width = inline.getWidth(c)
        if (width !== undefined) return width
      }
    }
    return 0
  }
  const getHeight = (c: RichTextInline) => {
    if (props.plugin?.inlines) {
      for (const inline of props.plugin.inlines) {
        const height = inline?.getHeight?.(c)
        if (height !== undefined) return height
      }
    }
    return
  }
  const getComposition = (blockIndex: number, index: number) => getTextComposition(index, state[blockIndex].children, c => getWidth(c, state[blockIndex]), c => isText(c) ? c.text : undefined)

  const { renderEditor, layoutResult, cursor, isSelected, actualHeight, lineHeights, inputContent, inputInline, getCopiedContents, ref: editorRef, positionToLocation, getPosition, setSelectionStart, setLocation, range, location, scrollY } = useFlowLayoutBlockEditor<RichTextInline, RichTextBlock, RichText>({
    state,
    setState,
    width: props.width,
    height: props.height,
    lineHeight: (c, b) => {
      if (isText(c)) {
        let lineHeight = (c.fontSize ?? b.fontSize ?? defaultFontSize) * lineHeightRatio
        if (c.verticalAlign) {
          lineHeight += Math.abs(c.verticalAlign) * lineHeight * 2
        }
        return lineHeight
      }
      if (props.plugin?.inlines) {
        for (const inline of props.plugin.inlines) {
          const lineHeight = inline.getLineHeight(c)
          if (lineHeight !== undefined) return lineHeight
        }
      }
      return 0
    },
    readOnly: props.readOnly,
    processInput(e) {
      for (const processAtInput of hooksProcessInputs) {
        if (processAtInput(e)) {
          return true
        }
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
            navigator.clipboard.write([new ClipboardItem({
              'text/plain': new Blob([JSON.stringify(contents)], { type: 'text/plain' }),
              'text/html': new Blob([blocksToHtml(state, exportToHtmls)], { type: 'text/html' }),
            })])
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
    getWidth,
    isNewLineContent: c => isText(c) && c.text === '\n',
    isPartOfComposition: c => isText(c) && isWordCharactor(c.text),
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
      const { newSelectionStart, newLocation } = getWordByDoubleClick(state[blockIndex].children, contentIndex, c => isText(c) ? c.text : undefined)
      if (newSelectionStart !== undefined) setSelectionStart([blockIndex, newSelectionStart])
      if (newLocation !== undefined) setLocation([blockIndex, newLocation])
    },
    keepSelectionOnBlur: true,
    isSameType: (a, b) => a.type === b?.type,
    getHeight,
  })
  const currentLocation = range ? range.min : location
  const getCurrentContent = (draft: readonly RichTextBlock[]) => {
    const blockIndex = currentLocation[0]
    const block = draft[blockIndex]
    const contentIndex = block ? location[1] <= 0 ? 0 : location[1] - 1 ?? block.children.length - 1 : undefined
    return {
      currentBlock: block,
      currentContent: contentIndex !== undefined ? block.children[contentIndex] : undefined,
      currentContentLayout: blockIndex !== undefined && contentIndex !== undefined ? layoutResult[blockIndex][contentIndex] : undefined
    }
  }
  const { currentBlock, currentContent, currentContentLayout } = getCurrentContent(state)

  const inputText = (text: string | (string | RichTextInline)[]) => {
    if (props.readOnly) return
    const result: RichTextInline[] = []
    for (const t of text) {
      if (typeof t === 'string') {
        const newText: RichText = { ...currentContent, text: t, kind: undefined }
        result.push(newText)
      } else {
        result.push({ ...currentContent, ...t })
      }
    }
    inputInline(result)
  }
  const paste = () => {
    if (props.readOnly) return
    navigator.clipboard.readText().then(v => {
      if (v) {
        try {
          const contents: readonly RichTextBlock[] = JSON.parse(v)
          if (contents.length === 1) {
            inputInline(contents[0].children)
          } else {
            inputContent(contents)
          }
        } catch {
          inputInline(v.split('').map(s => ({ text: s, kind: undefined })))
        }
      }
    })
  }
  const updateCurrentContent = (recipe: (richText: RichTextInline) => void) => {
    setState(draft => {
      const current = getCurrentContent(draft)
      if (current.currentContent) {
        recipe(current.currentContent)
      }
    })
  }

  const hooksProcessInputs: NonNullable<ReturnType<RichTextEditorPluginHook>['processInput']>[] = []
  const hooksUIs: React.ReactNode[] = []
  const properties: ReturnType<RichTextEditorPluginHook>['propertyPanel'] = {}
  const exportToHtmls: NonNullable<ReturnType<RichTextEditorPluginHook>['exportToHtml']>[] = []
  const hooksRenders: NonNullable<ReturnType<RichTextEditorPluginHook>['render']>[] = []
  if (props.plugin?.hooks) {
    const hooksProps = { cursor, cursorHeight: lineHeights[cursor.row], inputText, inputContent, currentContent, currentContentLayout, updateCurrentContent }
    props.plugin.hooks.forEach((useHook, i) => {
      const { processInput, ui, propertyPanel, exportToHtml, render } = useHook(hooksProps)
      if (processInput) hooksProcessInputs.push(processInput)
      if (ui) hooksUIs.push(React.cloneElement(ui, { key: i }))
      if (exportToHtml) exportToHtmls.push(exportToHtml)
      if (propertyPanel) Object.assign(properties, propertyPanel)
      if (render) hooksRenders.push(render)
    })
  }
  const [othersLocation, setOthersLocation] = React.useState<{ location: [number, number], operator: string }[]>([])

  React.useImperativeHandle<RichTextEditorRef, RichTextEditorRef>(ref, () => ({
    handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }) {
      try {
        applyPatchFromOtherOperators(data.patches, data.reversePatches, data.operator)
      } catch (error) {
        console.error(error)
      }
    },
    handleLocationEvent(data: { location?: [number, number], operator: string }) {
      setOthersLocation(produce(othersLocation, (draft) => {
        const index = othersLocation.findIndex((s) => s.operator === data.operator)
        if (index >= 0) {
          if (data.location && state[data.location[0]]?.children?.[data.location[1]]) {
            draft[index].location = data.location
          } else {
            draft.splice(index, 1)
          }
        } else if (data.location) {
          draft.push({ location: data.location, operator: data.operator })
        }
      }))
    },
  }), [applyPatchFromOtherOperators])

  React.useEffect(() => {
    const h = blocksToHtml(state, exportToHtmls)
    setHtml(h)
    props.onExport?.(h)
  }, [state])

  const children: unknown[] = []
  let decimalIndex = 0
  layoutResult.forEach((r, blockIndex) => {
    const block = state[blockIndex]
    const first = r[0]
    const blockFontSize = block.fontSize ?? defaultFontSize
    const blockColor = block.color ?? 0x000000
    const blockFontFamily = block.fontFamily ?? defaultFontFamily
    if (props.plugin?.blocks && !props.useHtml) {
      for (const { render } of Object.values(props.plugin.blocks)) {
        const renderResult = render?.(block, props.target, first.x, first.y, props.width)
        if (renderResult) {
          children.push(renderResult)
          break
        }
      }
    }
    decimalIndex = block.listStyleType === 'decimal' ? decimalIndex + 1 : 0
    if (!props.useHtml && block.listStyleType === 'disc') {
      const lineHeight = lineHeights[first.row]
      const radius = blockFontSize / 7
      children.push(props.target.renderCircle(first.x - blockFontSize + radius, first.y + lineHeight / 2, radius, { fillColor: blockColor, strokeWidth: 0 }))
    } else if (!props.useHtml && block.listStyleType === 'decimal') {
      const lineHeight = lineHeights[first.row]
      const offsetY = (lineHeightRatio - 1) / 2 / lineHeightRatio * lineHeight * 2
      children.push(props.target.renderText(first.x - blockFontSize + blockFontSize / 3, first.y - offsetY + lineHeight / lineHeightRatio, decimalIndex + '.', blockColor, blockFontSize, blockFontFamily, { textAlign: 'right', }))
    }
    r.forEach(({ x, y, content, visible, row }, contentIndex) => {
      if (!visible) return
      const lineHeight = lineHeights[row]
      if (isText(content)) {
        const color = content.color ?? blockColor
        const backgroundColor = content.backgroundColor ?? block.backgroundColor
        const fontFamily = content.fontFamily ?? blockFontFamily
        const fontSize = content.fontSize ?? blockFontSize
        const textWidth = getWidth(content, block)
        if (isSelected([blockIndex, contentIndex])) {
          children.push(props.target.renderRect(x, y, textWidth, lineHeight, { fillColor: 0xB3D6FD, strokeWidth: 0 }))
        }
        if (props.useHtml) return
        const offsetY = (lineHeightRatio - 1) / 2 / lineHeightRatio * lineHeight * 2
        if (backgroundColor !== undefined) {
          const textHeight = fontSize * lineHeightRatio
          children.push(props.target.renderRect(x, y + Math.max(lineHeight - offsetY - textHeight, 0), textWidth, textHeight, { fillColor: backgroundColor, strokeWidth: 0 }))
        }
        y -= offsetY
        if (content.verticalAlign) {
          y -= content.verticalAlign * lineHeight
        }
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
      } else if (!props.useHtml) {
        for (const render of hooksRenders) {
          const renderResult = render(content, props.target, x, y + lineHeight)
          if (renderResult) {
            children.push(renderResult)
            break
          }
        }
      }
      const others = othersLocation.filter(c => c.location[0] === blockIndex && c.location[1] === contentIndex)
      if (others.length > 0) {
        children.push(
          props.target.renderRect(x, y, 2, lineHeight, { fillColor: 0xff0000, strokeWidth: 0 }),
          props.target.renderText(x, y + 12 + lineHeight, others.map(h => h.operator).join(','), 0xff0000, 12, blockFontFamily),
        )
      }
    })
  })
  let result = props.target.renderResult(children, props.width, actualHeight)

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
            const child = block.children[j]
            if (isText(child)) {
              recipe(child)
            }
          }
        }
      })
    }
  }
  const updateTextInline = (type: BlockType) => {
    if (!props.plugin?.textInlines) return
    const textInline = props.plugin.textInlines[type]
    if (!textInline) return
    if (range) {
      setState(draft => {
        for (let i = range.min[0]; i <= range.max[0]; i++) {
          const block = draft[i]
          const start = i === range.min[0] ? range.min[1] : 0
          const end = i === range.max[0] ? range.max[1] : block.children.length
          const fontSize = textInline.fontSize ? textInline.fontSize * (block.fontSize ?? defaultFontSize) : undefined
          for (let j = start; j < end; j++) {
            const child = block.children[j]
            if (isText(child)) {
              child.type = type
              updateRichTextStyle(child, textInline)
              child.fontSize = fontSize
            }
          }
        }
      })
    }
  }
  const updateParagraph = (type: BlockType) => {
    if (!props.plugin?.blocks) return
    const block = props.plugin.blocks[type]
    if (!block) return
    if (block.void) {
      inputContent([{ ...block, type, children: [] }])
      return
    }
    const updateBlock = (b: RichTextBlock) => {
      b.type = type
      const fontSize = defaultFontSize * (block.fontSize ?? 1)
      b.blockStart = fontSize * (block.blockStart ?? 0)
      b.blockEnd = fontSize * (block.blockEnd ?? 0)
      b.inlineStart = block.inlineStart
      b.listStyleType = block.listStyleType
      updateRichTextStyle(b, block)
      b.fontSize = block.fontSize ? fontSize : undefined
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

  if (props.plugin?.styles && currentContent && isText(currentContent)) {
    for (const key in props.plugin.styles) {
      properties[key] = props.plugin.styles[key](currentContent, currentBlock, updateSelection)
    }
  }
  if (props.plugin?.textInlines) {
    properties.textInlines = <div>{getKeys(props.plugin.textInlines).map(t => <Button key={t} style={{ fontWeight: currentContent && isText(currentContent) && currentContent.type === t ? 'bold' : undefined }} onClick={() => updateTextInline(t)}>{t}</Button>)}</div>
  }
  if (props.plugin?.blocks) {
    properties.block = <div>{getKeys(props.plugin.blocks).map(t => <Button key={t} style={{ fontWeight: state[location[0]]?.type === t ? 'bold' : undefined }} onClick={() => updateParagraph(t)}>{t}</Button>)}</div>
  }

  if (props.useHtml) {
    result = (
      <>
        {result}
        <div
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            width: props.width + 'px',
            height: props.height + 'px',
            fontFamily: defaultFontFamily,
            fontSize: defaultFontSize + 'px',
            position: 'absolute',
            top: `${scrollY}px`,
          }}
        ></div>
      </>
    )
  }

  return (
    <div style={{ position: 'relative', margin: '10px' }}>
      <div style={{ display: 'flex' }}>
        {renderEditor(result)}
        <ObjectEditor inline properties={properties} />
      </div>
      {hooksUIs}
    </div>
  )
})

function updateRichTextStyle(target: Partial<RichTextStyle>, source: Partial<RichTextStyle>) {
  target.bold = source.bold
  target.italic = source.italic
  target.fontFamily = source.fontFamily
  target.underline = source.underline
  target.passThrough = source.passThrough
  target.color = source.color
  target.backgroundColor = source.backgroundColor
  target.verticalAlign = source.verticalAlign
}

export interface RichTextEditorPlugin {
  blocks?: Partial<Record<BlockType, RichTextEditorPluginBlock>>
  styles?: Record<string, RichTextEditorPluginStyle>
  hooks?: RichTextEditorPluginHook[]
  inlines?: RichTextEditorPluginInline[]
  textInlines?: Partial<Record<BlockType, RichTextEditorPluginTextInline>>
}

export interface RichTextEditorRef {
  handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }): void
  handleLocationEvent(data: { location?: [number, number], operator: string }): void
}
