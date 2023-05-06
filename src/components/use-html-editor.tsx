import type { Draft } from 'immer';
import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server";
import { compareLocations, FlowLayoutBlock, FlowLayoutBlockStyle, getWordByDoubleClick } from "."
import { equals, getColorString, Merger, Position, Reducer, Region, Size } from "../utils"
import { Cursor } from "./cursor";
import { Scrollbar } from "./scrollbar"
import { metaKeyIfMacElseCtrlKey } from "../utils/key"
import { useFlowLayoutBlockOperation } from './use-flow-layout-block-editor'

/**
 * @public
 */
export function useHtmlEditor(props: {
  state: readonly HtmlBlock[]
  width: number
  height: number
  setState(recipe: (draft: Draft<HtmlBlock>[]) => void): void
  processInput?(e: React.KeyboardEvent<HTMLInputElement>): boolean
  onLocationChanged?(location?: [number, number]): void
  style?: React.CSSProperties
  autoHeight?: boolean
  readOnly?: boolean
  onBlur?: () => void
  onFocus?: () => void
  plugin?: HtmlEditorPlugin
  resizeOffset: Size
  keepSelectionOnBlur?: boolean
}) {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const [cursorRect, setCursorRect] = React.useState<Region>()
  const layoutResults = React.useRef<HtmlLayoutResult>()

  const { range, inputContent, inputInline, getCopiedContents, scrollRef,
    scrollY, dragLocation, setY, selectionStart, setSelectionStart, ref: cursorRef, setLocation, location, contentHeight, setContentHeight, blockLocation,
    contentLocation, actualHeight, isSelected, onBlur, onMouseUp: mouseUp, onMouseDown: mouseDown, onMouseMove: mouseMove, onKeyDown: keyDown } = useFlowLayoutBlockOperation(props)

  const getCurrentContent = (draft: readonly HtmlBlock[]) => {
    const blockIndex = range ? range.min[0] : location[0]
    const block = draft[blockIndex]
    const contentIndex = block ? location[1] <= 0 ? 0 : location[1] - 1 ?? block.children.length - 1 : undefined
    return {
      currentBlock: block,
      currentContent: contentIndex !== undefined ? block.children[contentIndex] : undefined,
      currentContentLayout: blockIndex !== undefined && contentIndex !== undefined && layoutResults.current ? layoutResults.current.cells[blockIndex]?.[contentIndex] : undefined
    }
  }
  const { currentBlock, currentContent, currentContentLayout } = getCurrentContent(props.state)

  const renderInline = (c: HtmlTextInline) => {
    if (props.plugin?.inlines) {
      for (const inline of props.plugin.inlines) {
        const result = inline?.render?.(c, props.resizeOffset)
        if (result !== undefined) return result
      }
    }
    return
  }
  const inputText = (text: string | (string | HtmlTextInline)[]) => {
    if (props.readOnly) return
    const result: HtmlTextInline[] = []
    for (const t of text) {
      if (typeof t === 'string') {
        const newText: HtmlText = { ...currentContent, text: t, kind: undefined }
        result.push(newText)
      } else {
        result.push({ ...currentContent, ...t })
      }
    }
    inputInline(result)
  }
  const arrowUp = (shift = false) => {
    if (!shift && range) {
      setSelectionStart(undefined)
      setLocation(range.min)
      return
    }
    if (shift && selectionStart === undefined) {
      setSelectionStart(location)
    }
    if (cursorY < firstLineHeight) {
      setLocation([0, 0])
      return
    }
    let layoutResult: { y: number, height: number } | undefined
    if (layoutResults.current) {
      for (let i = layoutResults.current.rows.length - 1; i >= 0; i--) {
        const r = layoutResults.current.rows[i]
        if (r.y + r.height / 2 < cursorY) {
          layoutResult = r
          break
        }
      }
    }
    const y = layoutResult ? layoutResult.y + layoutResult.height / 2 : cursorY - cursorHeight * 0.5
    setLocation(positionToLocation({
      x: cursorX - (cursorRect?.width ?? 0) / 2,
      y: y + scrollY,
    }))
  }
  const arrowDown = (shift = false) => {
    if (!shift && range) {
      setSelectionStart(undefined)
      setLocation(range.max)
      return
    }
    if (shift && selectionStart === undefined) {
      setSelectionStart(location)
    }
    const layoutResult = layoutResults.current?.rows.find(r => r.y > cursorY + cursorHeight / 2)
    const y = layoutResult ? layoutResult.y + layoutResult.height / 2 : cursorY + cursorHeight * 1.5
    setLocation(positionToLocation({
      x: cursorX - (cursorRect?.width ?? 0) / 2,
      y: y + scrollY,
    }))
  }
  const paste = () => {
    if (props.readOnly) return
    navigator.clipboard.readText().then(v => {
      if (v) {
        try {
          const contents: readonly HtmlBlock[] = JSON.parse(v)
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
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    keyDown(e, arrowUp, arrowDown, () => {
      if (metaKeyIfMacElseCtrlKey(e)) {
        if (e.key === 'v') {
          paste()
          e.preventDefault()
          return
        }
        if (e.key === 'c' || e.key === 'x') {
          const contents = getCopiedContents(e.key === 'x')
          if (contents) {
            const html = renderToStaticMarkup(<>{renderContents(contents, () => false, renderInline)}</>)
            // eslint-disable-next-line plantain/promise-not-await
            navigator.clipboard.write([new ClipboardItem({
              'text/plain': new Blob([JSON.stringify(contents)], { type: 'text/plain' }),
              'text/html': new Blob([html], { type: 'text/html' }),
            })])
          }
          return
        }
      } else if (e.key.length === 1) {
        inputText(e.key)
      }
    })
  }
  const getPosition = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = rootRef.current?.getBoundingClientRect()
    return {
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
    }
  }
  const positionToLocation = (p: Position): [number, number] => {
    if (layoutResults.current) {
      let previous: [number, number] | undefined
      for (let i = 0; i < layoutResults.current.cells.length; i++) {
        const block = layoutResults.current.cells[i]
        for (let j = 0; j < block.length; j++) {
          const result = block[j]
          if (
            p.x >= result.x &&
            p.y >= result.y &&
            p.x <= result.x + result.width &&
            p.y <= result.y + result.height
          ) {
            const content = props.state[i].children[j]
            if (!isHtmlText(content)) {
              return [i, j + 1]
            }
            if (p.x < result.x + result.width / 2) {
              return [i, j]
            }
            return [i, j + 1]
          }
          if (p.y < layoutResults.current.rows[result.row].y) {
            if (j === 0 && previous) {
              return previous
            }
            return [i, j]
          }
          previous = [i, j]
        }
      }
    }
    return [props.state.length - 1, props.state[props.state.length - 1].children.length]
  }
  const isPositionInRange = (p: Position) => {
    if (range && layoutResults.current) {
      for (let blockIndex = 0; blockIndex < layoutResults.current.cells.length; blockIndex++) {
        const block = layoutResults.current.cells[blockIndex]
        for (let contentIndex = 0; contentIndex < block.length; contentIndex++) {
          const r = block[contentIndex]
          const loc = [blockIndex, contentIndex] as const
          if (compareLocations(loc, range.min) >= 0 && compareLocations(loc, range.max) < 0) {
            if (p.x > r.x && p.y > r.y && p.x < r.x + r.width && p.y < r.y + r.height) {
              return true
            }
          }
        }
      }
    }
    return false
  }
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    mouseDown(e, getPosition, positionToLocation, isPositionInRange)
  }
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    mouseMove(e, getPosition, positionToLocation, scrollY, firstLineHeight, lastLineHeight)
  }
  const onMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseMove(e)
    mouseUp()
  }

  React.useLayoutEffect(() => {
    if (!rootRef.current) return
    layoutResults.current = getHtmlLayout(rootRef.current.children)
  }, [props.state, rootRef.current])
  React.useEffect(() => {
    if (!layoutResults.current) return
    const parentResult = layoutResults.current.cells[dragLocation?.[0] ?? blockLocation]
    let rect: Region | undefined
    if (parentResult) {
      const c = dragLocation?.[1] ?? contentLocation
      if (c === 0) {
        rect = parentResult[0]
      } else {
        const previous = parentResult[c - 1]
        if (previous) {
          rect = {
            ...previous,
            x: previous.x + previous.width,
          }
        }
      }
    }
    setCursorRect(rect)
  }, [layoutResults.current, blockLocation, contentLocation, dragLocation])

  const newContentHeight = rootRef.current?.offsetHeight
  if (newContentHeight && contentHeight < newContentHeight) {
    setContentHeight(newContentHeight)
  }
  const firstLineHeight = layoutResults.current?.cells?.[0]?.[0]?.height ?? defaultFontSize
  const lastLineHeight = layoutResults.current?.cells?.[props.state.length - 1]?.[0]?.height ?? defaultFontSize

  const p = layoutResults.current?.cells?.[dragLocation?.[0] ?? blockLocation]?.[dragLocation?.[1] ?? contentLocation]
  const cursorX = p?.x ?? 0
  const cursorY = (p?.y ?? 0) - scrollY
  const cursorHeight = p?.height ?? 0

  const lastLocation = React.useRef<[number, number]>()
  const lastCursorY = React.useRef<number>()
  React.useEffect(() => {
    if ((equals(lastLocation.current?.[0], location[0]) &&
      equals(lastLocation.current?.[1], location[1]) &&
      equals(lastCursorY.current, cursorY)) || props.autoHeight) {
      return
    }
    const y = cursorY + scrollY
    if (y < 0) {
      setY(-cursorY)
    }
    lastLocation.current = location
    lastCursorY.current = cursorY
  }, [location, cursorY, scrollY])

  const renderResult = renderContents(props.state, isSelected, renderInline)

  const updateSelection = (recipe: (htmlText: Partial<HtmlTextStyle>) => void) => {
    if (range) {
      props.setState(draft => {
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
            if (isHtmlText(child)) {
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
      props.setState(draft => {
        for (let i = range.min[0]; i <= range.max[0]; i++) {
          const block = draft[i]
          const start = i === range.min[0] ? range.min[1] : 0
          const end = i === range.max[0] ? range.max[1] : block.children.length
          const fontSize = textInline.fontSize ? textInline.fontSize * (block.fontSize ?? defaultFontSize) : undefined
          for (let j = start; j < end; j++) {
            const child = block.children[j]
            if (isHtmlText(child)) {
              child.type = type
              updateHtmlTextStyle(child, textInline)
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
    const updateBlock = (b: HtmlBlock) => {
      b.type = type
      const fontSize = defaultFontSize * (block.fontSize ?? 1)
      b.blockStart = fontSize * (block.blockStart ?? 0)
      b.blockEnd = fontSize * (block.blockEnd ?? 0)
      b.inlineStart = block.inlineStart
      b.listStyleType = block.listStyleType
      updateHtmlTextStyle(b, block)
      b.fontSize = block.fontSize ? fontSize : undefined
    }
    if (!range) {
      props.setState(draft => {
        const i = location[0]
        updateBlock(draft[i])
      })
      return
    }
    props.setState(draft => {
      const startBlockIndex = range.min[0]
      const endBlockIndex = range.max[0]
      for (let i = startBlockIndex; i <= endBlockIndex; i++) {
        updateBlock(draft[i])
      }
    })
  }
  const updateCurrentContent = (recipe: (richText: HtmlTextInline) => void) => {
    props.setState(draft => {
      const current = getCurrentContent(draft)
      if (current.currentContent) {
        recipe(current.currentContent)
      }
    })
  }

  return {
    currentContent,
    currentBlock,
    currentContentLayout,
    updateSelection,
    updateTextInline,
    updateParagraph,
    updateCurrentContent,
    inputText,
    layoutResult: layoutResults.current,
    cursor: {
      x: cursorX,
      y: cursorY + scrollY,
      height: cursorHeight,
    },
    inputContent,
    location,
    scrollY,
    renderEditor: (children: JSX.Element) => {
      return <div
        style={{
          position: 'relative',
          width: props.width + 'px',
          height: actualHeight + 'px',
          border: '1px solid black',
          clipPath: 'inset(0px 0px)',
          ...props.style,
        }}
        onMouseLeave={onMouseUp}
        ref={scrollRef}
      >
        <Cursor
          ref={cursorRef}
          onKeyDown={onKeyDown}
          onCompositionEnd={e => {
            inputText(e.data)
            if (cursorRef.current) {
              cursorRef.current.value = ''
            }
          }}
          onBlur={onBlur}
          onFocus={props.onFocus}
          readOnly={props.readOnly}
          style={cursorRect ? {
            left: cursorRect.x + 'px',
            top: cursorRect.y + scrollY + 'px',
            height: cursorRect.height + 'px',
          } : undefined}
        />
        <div
          style={{
            width: props.width + 'px',
            position: 'absolute',
            fontFamily: defaultFontFamily,
            fontSize: defaultFontSize + 'px',
            top: `${scrollY}px`,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onDoubleClick={e => {
            const [blockIndex, contentIndex] = positionToLocation(getPosition(e))
            const { newSelectionStart, newLocation } = getWordByDoubleClick(props.state[blockIndex].children, contentIndex, c => isHtmlText(c) ? c.text : undefined)
            if (newSelectionStart !== undefined) setSelectionStart([blockIndex, newSelectionStart])
            if (newLocation !== undefined) setLocation([blockIndex, newLocation])
          }}
          ref={rootRef}
        >
          {renderResult}
        </div>
        {children}
        {!props.autoHeight && <Scrollbar
          value={scrollY}
          type='vertical'
          containerSize={props.height}
          contentSize={contentHeight}
          onChange={setY}
          align='head'
        />}
      </div>
    },
  }
}

/**
 * @public
 */
export interface HtmlEditorPlugin {
  blocks?: Partial<Record<BlockType, HtmlEditorPluginBlock>>
  inlines?: HtmlEditorPluginInline[]
  textInlines?: Partial<Record<BlockType, HtmlEditorPluginTextInline>>
}

/**
 * @public
 */
export interface HtmlEditorPluginInline {
  render?: (htmlText: HtmlTextInline, resizeOffset: Size) => JSX.Element | undefined
}

/**
 * @public
 */
export type HtmlEditorPluginBlock = Partial<HtmlTextStyle & FlowLayoutBlockStyle>

/**
 * @public
 */
export type HtmlEditorPluginTextInline = Partial<HtmlTextStyle>

function renderContents(
  contents: readonly HtmlBlock[],
  isSelected: (loc: [number, number]) => boolean | undefined,
  renderInline?: (htmlText: HtmlTextInline) => JSX.Element | undefined,
) {
  const result: JSX.Element[] = []
  const merger = new Merger<{ index: number, block: HtmlBlock }, { index: number, children: JSX.Element[] }>(
    last => {
      const style = renderHtmlBlockStyle(last.type.block)
      const children = last.target.map(t => <li key={t.index}>{t.children}</li>)
      result.push(React.createElement(last.type.block.type, { key: last.type.index, style }, children))
    },
    (a, b) => a.block.type === b.block.type,
    a => ({ index: a.index, children: renderHtmlBlockChildren(a.block, contentIndex => isSelected([a.index, contentIndex]), renderInline) }),
  )
  for (let blockIndex = 0; blockIndex < contents.length; blockIndex++) {
    const b = contents[blockIndex]
    const style = renderHtmlBlockStyle(b)
    if (b.void) {
      merger.flushLast()
      result.push(React.createElement(b.type, { key: blockIndex, style }))
      continue
    }
    const children = renderHtmlBlockChildren(b, contentIndex => isSelected([blockIndex, contentIndex]), renderInline)
    if (b.type === 'ul' || b.type === 'ol') {
      merger.push({ index: blockIndex, block: b })
      continue
    }
    merger.flushLast()
    result.push(React.createElement(b.type, { key: blockIndex, style }, children))
  }
  return result
}

/**
 * @public
 */
export interface HtmlLayoutResult {
  rows: { y: number, height: number }[]
  cells: (Region & { row: number })[][]
}

function getHtmlLayout(elements: HTMLCollection, rowIndex = 0): HtmlLayoutResult {
  const result: HtmlLayoutResult = {
    rows: [],
    cells: [],
  }
  const reducer = new Reducer<{ y: number, height: number }>(
    last => result.rows.push(last),
    (p, c) => c.y >= p.y + p.height,
    (p, c) => {
      if (c.y < p.y) {
        p.height = Math.max(p.y + p.height - c.y, c.height)
        p.y = c.y
      } else if (c.y + c.height > p.y + p.height) {
        p.height = c.y + c.height - p.y
      }
    }
  )
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]
    if (element.tagName === 'UL' || element.tagName === 'OL') {
      reducer.flushLast()
      const r = getHtmlLayout(element.children, result.rows.length)
      result.cells.push(...r.cells)
      result.rows.push(...r.rows)
      continue
    }
    const r: (Region & { row: number })[] = []
    for (let j = 0; j < element.children.length; j++) {
      // type-coverage:ignore-next-line
      const rect = getHtmlElementRect(element.children[j] as HTMLElement)
      reducer.push({ y: rect.y, height: rect.height })
      r.push({
        ...rect,
        row: result.rows.length + rowIndex,
      })
    }
    result.cells.push(r)
  }
  reducer.flushLast()
  return result
}

function getHtmlElementRect(element: HTMLElement) {
  return {
    x: element.offsetLeft,
    y: element.offsetTop,
    width: element.offsetWidth,
    height: element.offsetHeight,
  }
}

/**
 * @public
 */
export const defaultFontSize = 16
/**
 * @public
 */
export const defaultFontFamily = 'monospace'

/**
 * @public
 */
export interface HtmlText extends Partial<HtmlTextStyle> {
  text: string
  type?: string
  kind?: string
}

/**
 * @public
 */
export interface HtmlTextStyle {
  fontSize: number
  fontFamily: string
  bold: boolean
  italic: boolean
  underline: boolean
  passThrough: boolean
  color: number
  backgroundColor: number
  verticalAlign: number
}

/**
 * @public
 */
export type BlockType = keyof JSX.IntrinsicElements

/**
 * @public
 */
export interface HtmlBlock extends FlowLayoutBlock<HtmlTextInline>, Partial<HtmlTextStyle> {
  type: BlockType
}

/**
 * @public
 */
export interface HtmlTextInline {
  kind?: string
}

/**
 * @public
 */
export function isHtmlText(content: HtmlTextInline): content is HtmlText {
  return content.kind === undefined
}

/**
 * @public
 */
export function renderHtmlTextStyle(c: Partial<HtmlTextStyle>) {
  const style: React.CSSProperties = {}
  if (c.backgroundColor !== undefined) style.backgroundColor = getColorString(c.backgroundColor)
  if (c.bold) style.fontWeight = 'bold'
  if (c.color !== undefined) style.color = getColorString(c.color)
  if (c.fontFamily) style.fontFamily = c.fontFamily
  if (c.fontSize) style.fontSize = `${c.fontSize}px`
  if (c.italic) style.fontStyle = 'italic'
  const textDecorations: string[] = []
  if (c.passThrough) textDecorations.push('line-through')
  if (c.underline) textDecorations.push('underline')
  if (textDecorations.length > 0) style.textDecoration = textDecorations.join(' ')
  return style
}

function renderHtmlTextInline(
  c: HtmlTextInline,
  contentIndex: number,
  isSelected?: boolean,
  renderInline?: (htmlText: HtmlTextInline) => JSX.Element | undefined,
) {
  const r = renderInline?.(c)
  if (r) {
    return React.cloneElement(r, { key: contentIndex })
  }
  if (isHtmlText(c)) {
    const style = renderHtmlTextStyle(c)
    return React.createElement(
      c.type ?? 'span',
      {
        key: contentIndex,
        style: {
          ...style,
          backgroundColor: isSelected ? '#B3D6FD' : style.backgroundColor,
        },
      },
      c.text,
    )
  }
  return
}

function renderHtmlBlockStyle(b: HtmlBlock) {
  const style = renderHtmlTextStyle(b)
  if (b.blockStart) style.marginBlockStart = `${b.blockStart}px`
  if (b.blockEnd) style.marginBlockEnd = `${b.blockEnd}px`
  if (b.inlineStart) style.paddingInlineStart = `${b.inlineStart}px`
  return style
}

function renderHtmlBlockChildren(
  b: HtmlBlock,
  isSelected: (contentIndex: number) => boolean | undefined,
  renderInline?: (htmlText: HtmlTextInline) => JSX.Element | undefined,
) {
  const children: JSX.Element[] = []
  b.children.forEach((c, contentIndex) => {
    const d = renderHtmlTextInline(c, contentIndex, isSelected(contentIndex), renderInline)
    if (d) {
      children.push(d)
    }
  })
  children.push(<span key={-1}>{'\u200B'}</span>)
  return children
}

function updateHtmlTextStyle(target: Partial<HtmlTextStyle>, source: Partial<HtmlTextStyle>) {
  target.bold = source.bold
  target.italic = source.italic
  target.fontFamily = source.fontFamily
  target.underline = source.underline
  target.passThrough = source.passThrough
  target.color = source.color
  target.backgroundColor = source.backgroundColor
  target.verticalAlign = source.verticalAlign
}
