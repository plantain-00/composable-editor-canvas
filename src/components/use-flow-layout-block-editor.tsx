import { castDraft } from "immer"
import type { Draft } from 'immer/dist/types/types-external';
import * as React from "react"
import { useEvent, useGlobalMouseUp } from "."
import { equals, flowLayout, FlowLayoutResult, getFlowLayoutLocation, Position } from "../utils"
import { Cursor } from "./cursor";
import { Scrollbar } from "./scrollbar"
import { metaKeyIfMacElseCtrlKey } from "../utils/key"
import { useWheelScroll } from "./use-wheel-scroll"

/**
 * @public
 */
export function useFlowLayoutBlockEditor<T, V extends FlowLayoutBlock<T> = FlowLayoutBlock<T>, P extends T = T>(props: {
  state: readonly V[]
  width: number
  height: number
  lineHeight: number | ((content: T, block: V) => number)
  setState(recipe: (draft: Draft<V>[]) => void): void
  getWidth: (content: T, block: V) => number
  processInput?(e: React.KeyboardEvent<HTMLInputElement>): boolean
  onLocationChanged?(location?: [number, number]): void
  style?: React.CSSProperties
  autoHeight?: boolean
  readOnly?: boolean
  onBlur?: () => void
  onFocus?: () => void
  isNewLineContent?: (content: T) => boolean
  isPartOfComposition?: (content: T) => boolean
  getComposition?: (blockIndex: number, contentIndex: number) => { index: number, width: number }
  endContent: P
  onCompositionEnd?: React.CompositionEventHandler<HTMLInputElement>
  onDoubleClick?: React.MouseEventHandler<HTMLDivElement>
  keepSelectionOnBlur?: boolean
  isSameType?: (a: V, b: V | undefined) => boolean
  getHeight?: (content: T) => number | undefined
}) {
  const [location, setLocation] = React.useState<[number, number]>([0, 0])
  const [blockLocation, contentLocation] = location
  const [selectionStart, setSelectionStart] = React.useState<[number, number]>()
  const ref = React.useRef<HTMLInputElement | null>(null)
  const [contentHeight, setContentHeight] = React.useState(0)

  const inputContent = (newContents: readonly V[]) => {
    if (props.readOnly) return
    if (range) {
      const [blockIndex, contentIndex] = range.min
      const [maxBlockIndex, maxContentIndex] = range.max
      setSelectionStart(undefined)
      setLocation([blockIndex + newContents.length + 1, 0])
      props.setState(draft => {
        draft[blockIndex].children.splice(contentIndex, props.state[blockIndex].children.length)
        if (maxBlockIndex > blockIndex) {
          draft[maxBlockIndex].children.splice(0, maxContentIndex)
          draft.splice(blockIndex + 1, maxBlockIndex - blockIndex - 1, ...castDraft(newContents))
        } else {
          draft.splice(blockIndex + 1, 0, ...castDraft(newContents), castDraft({
            ...props.state[blockIndex],
            children: props.state[blockIndex].children.slice(maxContentIndex),
          }))
        }
      })
      return
    }
    setLocation([blockLocation + newContents.length + 1, 0])
    props.setState(draft => {
      draft[blockLocation].children.splice(contentLocation, props.state[blockLocation].children.length - contentLocation)
      draft.splice(blockLocation + 1, 0, ...castDraft(newContents), castDraft({
        ...props.state[blockLocation],
        children: props.state[blockLocation].children.slice(contentLocation),
      }))
    })
  }
  const inputInline = (items: readonly T[]) => {
    if (props.readOnly) return
    if (range) {
      const [blockIndex, contentIndex] = range.min
      const [maxBlockIndex, maxContentIndex] = range.max
      setSelectionStart(undefined)
      setLocation([blockIndex, contentIndex + items.length])
      props.setState(draft => {
        const newContents = maxBlockIndex > blockIndex ? [...items, ...props.state[maxBlockIndex].children.slice(maxContentIndex)] : items
        const deletionCount = (blockIndex === maxBlockIndex ? maxContentIndex : props.state[blockIndex].children.length) - contentIndex
        draft[blockIndex].children.splice(contentIndex, deletionCount, ...castDraft(newContents))
        if (maxBlockIndex > blockIndex) {
          draft.splice(blockIndex + 1, maxBlockIndex - blockIndex)
        }
      })
      return
    }
    setLocation([blockLocation, contentLocation + items.length])
    props.setState(draft => {
      draft[blockLocation].children.splice(contentLocation, 0, ...castDraft(items))
    })
  }
  const backspace = () => {
    if (props.readOnly) return
    if (range) {
      const [blockIndex, contentIndex] = range.min
      const [maxBlockIndex, maxContentIndex] = range.max
      setLocation(range.min)
      setSelectionStart(undefined)
      props.setState(draft => {
        const newContents = maxBlockIndex > blockIndex ? castDraft(props.state[maxBlockIndex].children.slice(maxContentIndex)) : []
        const deletionCount = (blockIndex === maxBlockIndex ? maxContentIndex : props.state[blockIndex].children.length) - contentIndex
        draft[blockIndex].children.splice(contentIndex, deletionCount, ...newContents)
        if (maxBlockIndex > blockIndex) {
          draft.splice(blockIndex + 1, maxBlockIndex - blockIndex)
        }
      })
      return
    }
    if (blockLocation === 0 && contentLocation === 0) {
      return
    }
    if (contentLocation !== 0) {
      setLocation([blockLocation, contentLocation - 1])
      props.setState(draft => {
        draft[blockLocation].children.splice(contentLocation - 1, 1)
      })
    } else {
      setLocation([blockLocation - 1, props.state[blockLocation - 1].children.length])
      props.setState(draft => {
        draft[blockLocation - 1].children.push(...draft[blockLocation].children)
        draft.splice(blockLocation, 1)
      })
    }
  }
  const arrowLeft = (shift = false) => {
    if (!shift && range) {
      setSelectionStart(undefined)
      setLocation(range.min)
      return
    }
    if (blockLocation === 0 && contentLocation === 0) {
      return
    }
    if (shift && selectionStart === undefined) {
      setSelectionStart(location)
    }
    if (contentLocation !== 0) {
      setLocation([blockLocation, contentLocation - 1])
    } else {
      setLocation(skipVoidBlock([blockLocation - 1, props.state[blockLocation - 1].children.length], true))
    }
  }
  const arrowRight = (shift = false) => {
    if (!shift && range) {
      setSelectionStart(undefined)
      setLocation(range.max)
      return
    }
    if (blockLocation === props.state.length - 1 && contentLocation === props.state[props.state.length - 1].children.length) {
      return
    }
    if (shift && selectionStart === undefined) {
      setSelectionStart(location)
    }
    if (contentLocation !== props.state[blockLocation].children.length) {
      setLocation([blockLocation, contentLocation + 1])
    } else {
      setLocation(skipVoidBlock([blockLocation + 1, 0]))
    }
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
    if (cursorY < firstLineHeight || cursorRow <= 0) {
      setLocation([0, 0])
      return
    }
    setLocation(positionToLocation({
      x: cursorX,
      y: cursorY - lineHeights[cursorRow - 1] / 2 + scrollY,
    }, false, true))
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
    if (cursorRow >= lineHeights.length - 1) {
      setLocation([props.state.length - 1, props.state[props.state.length - 1].children.length])
      return
    }
    setLocation(positionToLocation({
      x: cursorX,
      y: cursorY + lineHeights[cursorRow] + lineHeights[cursorRow + 1] / 2 + scrollY,
    }, false))
  }
  const selectAll = () => {
    setSelectionStart([0, 0])
    setLocation([props.state.length - 1, props.state[props.state.length - 1].children.length])
  }
  const getCopiedContents = (cut = false): V[] | undefined => {
    if (range === undefined) {
      return
    }
    if (cut) {
      backspace()
    }
    const [blockIndex, contentIndex] = range.min
    const [maxBlockIndex, maxContentIndex] = range.max
    const endIndex = blockIndex === maxBlockIndex ? maxContentIndex : props.state[blockIndex].children.length
    const result: V[] = [{
      ...props.state[blockIndex],
      children: props.state[blockIndex].children.slice(contentIndex, endIndex),
    }]
    for (let i = blockIndex + 1; i < maxBlockIndex; i++) {
      result.push(props.state[i])
    }
    if (maxBlockIndex > blockIndex) {
      result.push({
        ...props.state[maxBlockIndex],
        children: props.state[maxBlockIndex].children.slice(0, maxContentIndex),
      })
    }
    return result
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) {
      return
    }
    if (e.keyCode === 229) {
      return
    }
    if (props.processInput?.(e)) {
      return
    }
    if (e.key === 'Enter') {
      inputContent([])
      return true
    }
    if (['CapsLock', 'Tab', 'Shift', 'Meta', 'Escape', 'Control'].includes(e.key)) return
    if (e.key === 'Backspace') return backspace()
    if (e.key === 'ArrowLeft') return arrowLeft(e.shiftKey)
    if (e.key === 'ArrowRight') return arrowRight(e.shiftKey)
    if (e.key === 'ArrowUp') return arrowUp(e.shiftKey)
    if (e.key === 'ArrowDown') return arrowDown(e.shiftKey)
    if (metaKeyIfMacElseCtrlKey(e)) {
      if (e.key === 'a') return selectAll()
    } else {
      e.preventDefault()
    }
  }
  const onBlur = () => {
    if (!props.keepSelectionOnBlur) {
      setSelectionStart(undefined)
    }
    props.onLocationChanged?.()
    props.onBlur?.()
  }
  const downLocation = React.useRef<[number, number]>()
  const getPosition = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // type-coverage:ignore-next-line
    const bounding = (e.target as HTMLDivElement).getBoundingClientRect()
    return {
      x: e.clientX - bounding.left,
      y: e.clientY - bounding.top,
    }
  }
  const skipVoidBlock = ([i, j]: [number, number], forward?: boolean) => {
    while (props.state[i].void) {
      if (forward) {
        i--
        j = props.state[i].children.length
      } else {
        i++
        j = 0
      }
    }
    return [i, j] as [number, number]
  }
  const positionToLocation = (p: Position, ignoreInvisible = true, forward?: boolean): [number, number] => {
    for (let i = 0; i < layoutResult.length; i++) {
      if (layoutResult[i].length > 0 && layoutResult[i][0].y > p.y) {
        return skipVoidBlock([i, 0], forward)
      }
      const loc = getFlowLayoutLocation(p, lineHeights, layoutResult[i], scrollY, c => props.getWidth(c, props.state[i]), ignoreInvisible, props.getHeight)
      if (loc !== undefined) {
        return skipVoidBlock([i, loc], forward)
      }
    }
    return [props.state.length - 1, props.state[props.state.length - 1].children.length]
  }
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const p = positionToLocation(getPosition(e))
    if (e.shiftKey) {
      if (selectionStart === undefined) {
        setSelectionStart(location)
      }
      setLocation(p)
    } else {
      downLocation.current = p
    }
  }
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (downLocation.current === undefined) {
      return
    }
    const s = getPosition(e)
    const p = positionToLocation(s, false)
    setLocation(p)
    if (p[0] === downLocation.current[0] && p[1] === downLocation.current[1]) {
      setSelectionStart(undefined)
    } else {
      setSelectionStart(downLocation.current)
    }
    if (!props.autoHeight) {
      if (s.y >= 0 && s.y <= firstLineHeight) {
        setY(y => filterY(y + 2))
      } else if (s.y <= props.height && s.y >= props.height - lastLineHeight) {
        setY(y => filterY(y - 2))
      }
    }
  }
  const onMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseMove(e)
    ref.current?.focus()
  }
  useGlobalMouseUp(useEvent(() => {
    downLocation.current = undefined
  }))

  const { ref: scrollRef, y: scrollY, setY, filterY } = useWheelScroll<HTMLDivElement>({
    minY: props.autoHeight ? 0 : contentHeight > props.height ? props.height - contentHeight : 0,
    maxY: 0,
    disabled: props.autoHeight,
  })
  React.useEffect(() => {
    if (props.autoHeight) {
      setY(0)
    }
  }, [props.autoHeight, setY])

  const layoutResult: FlowLayoutResult<T>[][] = []
  let newContentHeight = 0
  const lineHeights: number[] = []
  let row = 0
  let blockEnd = 0
  const getComposition = props.getComposition
  const lineHeight = props.lineHeight
  props.state.forEach((block, blockIndex) => {
    const start = block.listStyleType && props.isSameType?.(block, props.state[blockIndex - 1]) ? 0 : (block.blockStart ?? 0)
    const end = block.listStyleType && props.isSameType?.(block, props.state[blockIndex + 1]) ? 0 : (block.blockEnd ?? 0)
    const blockStart = Math.max(start, blockEnd)
    const r = flowLayout({
      state: block.children,
      width: props.width,
      height: props.autoHeight ? undefined : props.height,
      lineHeight: typeof lineHeight === 'number' ? lineHeight : (c) => lineHeight(c, block),
      getWidth: c => props.getWidth(c, block),
      isNewLineContent: props.isNewLineContent,
      isPartOfComposition: props.isPartOfComposition,
      getComposition: getComposition ? (i) => getComposition(blockIndex, i) : undefined,
      endContent: props.endContent,
      scrollX: block.inlineStart,
      scrollY: scrollY + newContentHeight + blockStart,
      row,
    })
    layoutResult.push(r.layoutResult)
    if (!block.void) {
      newContentHeight += r.newContentHeight
    }
    newContentHeight += blockStart
    lineHeights.push(...r.lineHeights)
    row += r.lineHeights.length
    blockEnd = end
  })
  newContentHeight += blockEnd

  if (contentHeight < newContentHeight) {
    setContentHeight(newContentHeight)
  }
  const firstLineHeight = lineHeights[0]
  const lastLineHeight = lineHeights[lineHeights.length - 1]

  let range: { min: [number, number], max: [number, number] } | undefined
  if (selectionStart !== undefined) {
    range = compareLocations(selectionStart, location) > 0 ? { min: location, max: selectionStart } : { min: selectionStart, max: location }
  }
  const p = layoutResult[blockLocation]?.[contentLocation]
  const cursorX = p?.x ?? 0
  const cursorY = (p?.y ?? 0) - scrollY
  const cursorRow = p?.row ?? 0

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
    } else if (y > props.height - lastLineHeight) {
      setY(props.height - lastLineHeight - cursorY)
    }
    lastLocation.current = location
    lastCursorY.current = cursorY
  }, [location, cursorY, scrollY, lastLineHeight])

  React.useEffect(() => {
    props.onLocationChanged?.(location)
  }, [location])

  let actualHeight = props.height
  if (props.autoHeight && contentHeight > props.height) {
    actualHeight = contentHeight
  }
  const isSelected = (loc: [number, number]) => range && compareLocations(loc, range.min) >= 0 && compareLocations(loc, range.max) < 0

  return {
    ref,
    range,
    layoutResult,
    lineHeights,
    cursor: {
      x: cursorX,
      y: cursorY + scrollY,
      row: cursorRow,
    },
    inputContent,
    inputInline,
    location,
    setLocation,
    getCopiedContents,
    isSelected,
    actualHeight,
    setSelectionStart,
    getPosition,
    positionToLocation,
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
          ref={ref}
          onKeyDown={onKeyDown}
          onCompositionEnd={props.onCompositionEnd}
          onBlur={onBlur}
          onFocus={props.onFocus}
          readOnly={props.readOnly}
          style={{
            left: cursorX + 'px',
            top: cursorY + scrollY + 'px',
            height: lineHeights[cursorRow] + 'px',
          }}
        />
        {children}
        <div
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onDoubleClick={props.onDoubleClick}
          style={{ inset: '0px', cursor: 'text', position: 'absolute' }}
        ></div>
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
export function compareLocations(c1: [number, number], c2: [number, number]) {
  if (c1[0] < c2[0]) return -1
  if (c1[0] > c2[0]) return 1
  if (c1[1] < c2[1]) return -1
  if (c1[1] > c2[1]) return 1
  return 0
}

/**
 * @public
 */
export interface FlowLayoutBlock<T> extends Partial<FlowLayoutBlockStyle> {
  children: readonly T[]
}

/**
 * @public
 */
export interface FlowLayoutBlockStyle {
  blockStart: number
  blockEnd: number
  inlineStart: number
  listStyleType: 'disc' | 'decimal'
  void: boolean
}
