import * as React from "react"
import { flowLayout, getFlowLayoutLocation } from "../utils/flow-layout"
import { equals, Position } from "../utils/geometry"
import { Cursor } from "./cursor"
import { Scrollbar } from "./scrollbar"
import { useEvent } from "./use-event"
import { useGlobalMouseUp } from "./use-global-mouseup"
import { metaKeyIfMacElseCtrlKey } from "../utils/key"
import { useWheelScroll } from "./use-wheel-scroll"

/**
 * @public
 */
export function useFlowLayoutEditor<T>(props: {
  state: readonly T[]
  width: number
  height: number
  lineHeight: number | ((content: T) => number)
  setState(recipe: (draft: T[]) => void): void
  getWidth: (content: T) => number
  processInput?(e: React.KeyboardEvent<HTMLInputElement>): boolean
  onLocationChanged?(location: number): void
  style?: React.CSSProperties
  autoHeight?: boolean
  readOnly?: boolean
  onBlur?: () => void
  onFocus?: () => void
  isNewLineContent?: (content: T) => boolean
  isPartOfComposition?: (content: T) => boolean
  getComposition?: (index: number) => { index: number, width: number }
  endContent: T
  onCompositionEnd?: React.CompositionEventHandler<HTMLInputElement>
  onDoubleClick?: React.MouseEventHandler<HTMLDivElement>
  keepSelectionOnBlur?: boolean
}) {
  const [location, setLocation] = React.useState(0)
  const [selectionStart, setSelectionStart] = React.useState<number>()
  const ref = React.useRef<HTMLInputElement | null>(null)
  const [contentHeight, setContentHeight] = React.useState(0)

  const inputContent = (newContents: T[], contentLocation = newContents.length) => {
    if (props.readOnly) return
    if (range) {
      setLocation(range.min + contentLocation)
      setSelectionStart(undefined)
      props.setState(draft => {
        draft.splice(range.min, range.max - range.min, ...newContents)
      })
      return
    }
    setLocation(location + contentLocation)
    props.setState(draft => {
      draft.splice(location, 0, ...newContents)
    })
  }
  const backspace = () => {
    if (props.readOnly) return
    if (range) {
      setLocation(range.min)
      setSelectionStart(undefined)
      props.setState(draft => {
        draft.splice(range.min, range.max - range.min)
      })
      return
    }
    if (location === 0) {
      return
    }
    setLocation(location - 1)
    props.setState(draft => {
      draft.splice(location - 1, 1)
    })
  }
  const arrowLeft = (shift = false) => {
    if (!shift && range) {
      setSelectionStart(undefined)
      setLocation(range.min)
      return
    }
    if (location === 0) {
      return
    }
    if (shift && selectionStart === undefined) {
      setSelectionStart(location)
    }
    setLocation(location - 1)
  }
  const arrowRight = (shift = false) => {
    if (!shift && range) {
      setSelectionStart(undefined)
      setLocation(range.max)
      return
    }
    if (location === props.state.length) {
      return
    }
    if (shift && selectionStart === undefined) {
      setSelectionStart(location)
    }
    setLocation(location + 1)
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
      setLocation(0)
      return
    }
    setLocation(positionToLocation({
      x: cursorX,
      y: cursorY - lineHeights[cursorRow - 1] / 2 + scrollY,
    }, false))
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
      setLocation(props.state.length)
      return
    }
    setLocation(positionToLocation({
      x: cursorX,
      y: cursorY + lineHeights[cursorRow] + lineHeights[cursorRow + 1] / 2 + scrollY,
    }, false))
  }
  const selectAll = () => {
    setSelectionStart(0)
    setLocation(props.state.length)
  }
  const getCopiedContents = (cut = false) => {
    if (range === undefined) {
      return
    }
    if (cut) {
      backspace()
    }
    return props.state.slice(range.min, range.max)
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
    props.onLocationChanged?.(-1)
    props.onBlur?.()
  }
  const downLocation = React.useRef<number>()
  const getPosition = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // type-coverage:ignore-next-line
    const bounding = (e.target as HTMLDivElement).getBoundingClientRect()
    return {
      x: e.clientX - bounding.left,
      y: e.clientY - bounding.top,
    }
  }
  const positionToLocation = (p: Position, ignoreInvisible = true) => {
    return getFlowLayoutLocation(p, lineHeights, layoutResult, scrollY, props.getWidth, ignoreInvisible) ?? layoutResult.length - 1
  }
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const p = positionToLocation(getPosition(e))
    if (e.shiftKey) {
      if (selectionStart === undefined || Math.abs(selectionStart - p) < Math.abs(location - p)) {
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
    if (p === downLocation.current) {
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

  const { layoutResult, newContentHeight, lineHeights } = flowLayout({
    state: props.state,
    width: props.width,
    height: props.autoHeight ? undefined : props.height,
    lineHeight: props.lineHeight,
    getWidth: props.getWidth,
    isNewLineContent: props.isNewLineContent,
    isPartOfComposition: props.isPartOfComposition,
    getComposition: props.getComposition,
    endContent: props.endContent,
    scrollY,
  })
  if (contentHeight < newContentHeight) {
    setContentHeight(newContentHeight)
  }
  const firstLineHeight = lineHeights[0]
  const lastLineHeight = lineHeights[lineHeights.length - 1]

  const range = selectionStart !== undefined ? { min: Math.min(selectionStart, location), max: Math.max(selectionStart, location) } : undefined
  const p = layoutResult[location] ?? layoutResult[layoutResult.length - 1]
  const cursorX = p.x
  const cursorY = p.y - scrollY
  const cursorRow = p.row

  const lastLocation = React.useRef<number>()
  const lastCursorY = React.useRef<number>()
  React.useEffect(() => {
    if ((equals(lastLocation.current, location) && equals(lastCursorY.current, cursorY)) || props.autoHeight) {
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
  const isSelected = (index: number) => range && index >= range.min && index < range.max

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
    location,
    setLocation,
    getCopiedContents,
    isSelected,
    actualHeight,
    setSelectionStart,
    getPosition,
    positionToLocation,
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
