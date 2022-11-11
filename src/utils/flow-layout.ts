import { Position } from "./geometry"

/**
 * @public
 */
export function flowLayout<T>(props: {
  state: readonly T[]
  width: number
  height: number
  lineHeight: number
  getWidth: (content: T) => number
  autoHeight?: boolean
  isNewLineContent?: (content: T) => boolean
  isPartOfComposition?: (content: T) => boolean
  getComposition?: (index: number) => { index: number, width: number }
  endContent: T
  scrollY: number
}) {
  const isVisible = (y: number) => props.autoHeight ? true : y >= -props.lineHeight && y <= props.height

  const layoutResult: FlowLayoutResult<T>[] = []
  let x = 0
  let y = props.scrollY
  let i = 0
  let visible = isVisible(y)
  const toNewLine = () => {
    y += props.lineHeight
    visible = isVisible(y)
    x = 0
  }
  const addResult = (newLine: boolean) => {
    const content = props.state[i]
    layoutResult.push({ x, y, i, content, visible })
    if (newLine) {
      toNewLine()
    } else {
      x += props.getWidth(content)
    }
    i++
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
  layoutResult.push({ x, y, i, content: props.endContent, visible })
  const newContentHeight = y + props.lineHeight - props.scrollY
  return {
    layoutResult,
    newContentHeight,
  }
}

/**
 * @public
 */
export interface FlowLayoutResult<T> extends Position {
  i: number
  content: T
  visible: boolean
}

/**
 * @public
 */
export function getFlowLayoutLocation<T>(
  { x, y }: Position,
  lineHeight: number,
  layoutResult: FlowLayoutResult<T>[],
  scrollY: number,
  getWidth: (content: T) => number,
  ignoreInvisible = true,
) {
  if (y < scrollY) {
    return 0
  }
  const minY = y - lineHeight
  let result: FlowLayoutResult<T> | undefined
  for (const p of layoutResult) {
    if (ignoreInvisible && !p.visible) continue
    if (p.y >= minY && p.y <= y) {
      if (
        x <= p.x + getWidth(p.content) / 2 &&
        (!result || result.y + getWidth(result.content) / 2 <= x)
      ) {
        return p.i
      }
      result = p
    } else if (result !== undefined) {
      return result.i
    }
  }
  return layoutResult.length - 1
}
