import { Position } from "./geometry"

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
  scrollX?: number
  scrollY: number
  row?: number
}) {
  const isVisible = (y: number) => props.height === undefined
    ? true
    : (lineHeights.length > 0 ? y >= -lineHeights[0] : true) && y <= props.height

  const layoutResult: FlowLayoutResult<T>[] = []
  const lineHeights: number[] = []
  let x = props.scrollX ?? 0
  let y = props.scrollY
  let i = 0
  let row = props.row ?? 0
  let column = 0
  let visible = isVisible(y)
  let maxLineHeight = 0
  const toNewLine = () => {
    y += maxLineHeight
    lineHeights.push(maxLineHeight)
    visible = isVisible(y)
    x = 0
    row++
    column = 0
    maxLineHeight = 0
    if (lineHeights.length === 1) {
      layoutResult.forEach(r => {
        if (r.visible && !isVisible(r.y)) {
          r.visible = false
        }
      })
    }
  }
  const addResult = (newLine: boolean) => {
    const content = props.state[i]
    const lineHeight = typeof props.lineHeight === 'number' ? props.lineHeight : props.lineHeight(content)
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
    maxLineHeight = typeof props.lineHeight === 'number' ? props.lineHeight : props.lineHeight(props.endContent)
  }
  lineHeights.push(maxLineHeight)
  layoutResult.push({ x, y, i, content: props.endContent, visible, row, column })
  const newContentHeight = y + maxLineHeight - props.scrollY
  return {
    layoutResult,
    newContentHeight,
    lineHeights,
  }
}

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
    return 0
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
      return p.i + 1
    }
    if (y >= p.y && y <= p.y + lineHeight) {
      if (
        x <= p.x + getWidth(p.content) / 2 &&
        (!result || result.x + getWidth(result.content) / 2 <= x)
      ) {
        return p.i
      }
      result = p
    } else if (result !== undefined && i !== layoutResult.length - 1) {
      return result.i + 1
    }
  }
  if (result !== undefined) {
    return result.i
  }
  return
}