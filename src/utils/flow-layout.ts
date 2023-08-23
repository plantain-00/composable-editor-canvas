import { Position } from "./geometry"
import { or } from "./validators"

/**
 * @public
 */
export function flowLayout<T>(props: {
  state: readonly T[]
  width: number
  height?: number
  lineHeight: number | ((content: T) => number)
  getWidth: (content: T) => number
  isNewLineContent?: (content: T) => boolean
  isPartOfComposition?: (content: T) => boolean
  getComposition?: (index: number) => { index: number, width: number }
  endContent: T
  align?: Align
  verticalAlign?: VerticalAlign
  scrollX?: number
  scrollY?: number
  row?: number
}) {
  const isVisible = (y: number) => props.height === undefined
    ? true
    : (lineHeights.length > 0 ? y >= -lineHeights[0] : true) && y <= props.height

  const layoutResult: FlowLayoutResult<T>[] = []
  const lineHeights: number[] = []
  let x = props.scrollX ?? 0
  const scrollY = props.scrollY ?? 0
  let y = scrollY
  let i = 0
  let row = props.row ?? 0
  let column = 0
  let visible = isVisible(y)
  let maxLineHeight = 0
  let newLineIndex = 0
  const align = () => {
    if (props.align === 'center' || props.align === 'right') {
      const last = layoutResult[layoutResult.length - 1]
      let offset = props.width - last.x - props.getWidth(last.content)
      if (props.align === 'center') {
        offset /= 2
      }
      for (let j = newLineIndex; j < layoutResult.length; j++) {
        layoutResult[j].x += offset
      }
    }
  }
  const toNewLine = () => {
    y += maxLineHeight
    lineHeights.push(maxLineHeight)
    visible = isVisible(y)
    x = 0
    row++
    column = 0
    maxLineHeight = 0
    align()
    if (lineHeights.length === 1) {
      layoutResult.forEach(r => {
        if (r.visible && !isVisible(r.y)) {
          r.visible = false
        }
      })
    }
    newLineIndex = layoutResult.length
  }
  const getLineHeight = (content: T) => {
    return typeof props.lineHeight === 'number' ? props.lineHeight : props.lineHeight(content)
  }
  const addResult = (newLine: boolean) => {
    const content = props.state[i]
    const lineHeight = getLineHeight(content)
    if (lineHeight > maxLineHeight) {
      maxLineHeight = lineHeight
    }
    layoutResult.push({ x, y, i, content, visible, row, column })
    if (newLine) {
      toNewLine()
    } else {
      x += props.getWidth(content)
    }
    i++
    column++
  }
  while (i < props.state.length) {
    const content = props.state[i]
    if (props.isNewLineContent?.(content)) {
      addResult(true)
      continue
    }
    if (props.getComposition && props.isPartOfComposition?.(content)) {
      const w = props.getComposition(i)
      // a b|
      if (x + w.width <= props.width) {
        while (i < w.index) {
          addResult(false)
        }
        continue
      }
      // a b|c
      if (x > 0) {
        toNewLine()
      }
      // abc|
      if (w.width <= props.width) {
        while (i < w.index) {
          addResult(false)
        }
        continue
      }
      // abc|d
      while (i < w.index) {
        if (x + props.getWidth(props.state[i]) > props.width) {
          toNewLine()
        }
        addResult(false)
      }
      continue
    }
    // a|b
    if (x + props.getWidth(content) > props.width) {
      toNewLine()
    }
    addResult(false)
  }
  if (maxLineHeight === 0) {
    maxLineHeight = getLineHeight(props.endContent)
  }
  lineHeights.push(maxLineHeight)
  layoutResult.push({ x, y, i, content: props.endContent, visible, row, column })
  align()

  if (props.height && (props.verticalAlign === 'middle' || props.verticalAlign === 'bottom')) {
    let offset = props.height - lineHeights.reduce((p, c) => p + c)
    if (offset > 0) {
      if (props.verticalAlign === 'middle') {
        offset /= 2
      }
      layoutResult.forEach(r => {
        r.y += offset
      })
    }
  }

  const newContentHeight = y + maxLineHeight - scrollY
  return {
    layoutResult,
    newContentHeight,
    lineHeights,
  }
}

export const aligns = ['left', 'center', 'right'] as const
export type Align = (typeof aligns)[number]
export const Align = or(...aligns)

export const verticalAligns = ['top', 'middle', 'bottom'] as const
export type VerticalAlign = (typeof verticalAligns)[number]
export const VerticalAlign = or(...verticalAligns)

/**
 * @public
 */
export interface FlowLayoutResult<T> extends Position {
  i: number
  row: number
  column: number
  content: T
  visible: boolean
}

/**
 * @public
 */
export function getFlowLayoutLocation<T>(
  { x, y }: Position,
  lineHeight: number | number[],
  layoutResult: FlowLayoutResult<T>[],
  scrollY: number,
  getWidth: (content: T) => number,
  ignoreInvisible = true,
  getHeight?: (content: T) => number | undefined,
) {
  if (y < scrollY) {
    return { location: 0, lineEnd: false }
  }
  if (layoutResult.length > 0 && y < layoutResult[0].y) {
    return { location: 0, lineEnd: false }
  }
  const getLineHeight = (row: number) => {
    return typeof lineHeight === 'number' ? lineHeight : lineHeight[row]
  }
  let result: FlowLayoutResult<T> | undefined
  for (let i = 0; i < layoutResult.length; i++) {
    const p = layoutResult[i]
    if (ignoreInvisible && !p.visible) continue
    const lineHeight = getLineHeight(p.row)
    const height = getHeight?.(p.content)
    if (
      height !== undefined &&
      y >= p.y + lineHeight - height &&
      y <= p.y + lineHeight &&
      x >= p.x &&
      x <= p.x + getWidth(p.content)
    ) {
      return { location: p.i + 1, lineEnd: false }
    }
    if (y >= p.y && y <= p.y + lineHeight) {
      if (
        x <= p.x + getWidth(p.content) / 2 &&
        (!result || result.x + getWidth(result.content) / 2 <= x)
      ) {
        return { location: p.i, lineEnd: false }
      }
      result = p
    } else if (result !== undefined && i !== layoutResult.length - 1) {
      return { location: result.i + 1, lineEnd: true }
    }
  }
  if (result !== undefined) {
    return { location: result.i, lineEnd: false }
  }
  return
}
