import * as React from "react"
import { Align, VerticalAlign, flowLayout, getFlowLayoutLocation } from "../utils/flow-layout"
import { equals } from "../utils/math"
import { Position } from "../utils/position"
import { Cursor } from "./cursor"
import { Scrollbar } from "./scrollbar"
import { useEvent } from "./use-event"
import { useGlobalMouseUp } from "./use-global-mouseup"
import { metaKeyIfMacElseCtrlKey } from "../utils/key"
import { useWheelScroll } from "./use-wheel-scroll"
import { getTextComposition, getWordByDoubleClick, useTextComposing } from "./use-flow-layout-text-editor"
import { isWordCharactor } from "../utils/text"

export function useAttributedTextEditor<T extends object>(props: {
  state: AttributedText<T>[]
  width: number
  height: number
  lineHeight: number | ((content: AttributedText<T>) => number)
  setState(state: AttributedText<T>[]): void
  getWidth: (content: AttributedText<T>) => number
  processInput?(e: React.KeyboardEvent<HTMLInputElement>): boolean
  onLocationChanged?(location: number): void
  style?: React.CSSProperties
  autoHeight?: boolean
  readOnly?: boolean
  align?: Align
  verticalAlign?: VerticalAlign
  onBlur?: () => void
  onFocus?: () => void
  autoFocus?: boolean
  getReadonlyType?: (attributes?: T) => string | true | undefined
}) {
  const [location, setLocation] = React.useState(0)
  const [selectionStart, setSelectionStart] = React.useState<number>()
  const ref = React.useRef<HTMLInputElement | null>(null)
  const [contentHeight, setContentHeight] = React.useState(0)
  const [currentAttributes, setCurrentAttributes] = React.useState<{ index: number, attributes: T }>()
  const [lineEnd, setLineEnd] = React.useState(false)
  const { onComposing, getCompositionCountThenEnd } = useTextComposing()

  const inputText = (text: string, deleteCount?: number) => {
    if (props.readOnly) return
    let middleState: AttributedText<T>[]
    let newLocation: number
    let attributes = currentAttributes
    if (range) {
      newLocation = range.min
      middleState = deleteContentsInRange(range)
      if (cursorContent.attributes && !props.getReadonlyType?.(cursorContent.attributes)) {
        attributes = {
          attributes: cursorContent.attributes,
          index: range.min
        }
      }
    } else if (deleteCount) {
      newLocation = location - deleteCount
      middleState = deleteContentsInRange({ min: location - deleteCount, max: location })
      if (cursorContent.attributes && !props.getReadonlyType?.(cursorContent.attributes)) {
        attributes = {
          attributes: cursorContent.attributes,
          index: newLocation
        }
      }
    } else {
      newLocation = location
      middleState = props.state
    }
    setLocation(newLocation + text.length)
    const newState: AttributedText<T>[] = []
    let index = 0
    let inserted = false
    const inReadonlyRangeStart = readonlyRanges.some(r => r.min === newLocation)
    const inReadonlyRangeEnd = readonlyRanges.some(r => r.max === newLocation)
    for (const s of middleState) {
      const k = newLocation - index
      const insertLength = getInsertLength(s)
      if (k >= 0 && (inReadonlyRangeEnd ? k < insertLength : k <= insertLength) && !inserted) {
        if (inReadonlyRangeStart && k === 0) {
          newState.push({ insert: text, attributes: attributes?.attributes }, s)
          inserted = true
          index += insertLength
          continue
        }
        if (attributes) {
          if (k > 0) {
            newState.push({
              attributes: s.attributes,
              insert: s.insert.slice(0, k),
            })
          }
          newState.push({
            attributes: {
              ...s.attributes,
              ...attributes.attributes,
            },
            insert: text,
          })
          if (k < insertLength) {
            newState.push({
              attributes: s.attributes,
              insert: s.insert.slice(k),
            })
          }
        } else {
          newState.push({
            attributes: s.attributes,
            insert: s.insert.slice(0, k) + text + s.insert.slice(k),
          })
        }
        inserted = true
      } else {
        newState.push(s)
      }
      index += insertLength
    }
    if (!inserted) {
      newState.push({ insert: text, attributes: attributes?.attributes })
    }
    props.setState(newState)
  }
  const inputContent = (newContents: AttributedText<T>[], contentLocation: number, at?: number) => {
    if (props.readOnly) return
    let middleState: AttributedText<T>[] | undefined
    let newLocation: number
    if (range) {
      newLocation = range.min
      middleState = deleteContentsInRange(range)
    } else {
      newLocation = location
      middleState = props.state
    }
    if (at !== undefined) {
      newLocation = at
    }
    setLocation(newLocation + contentLocation)
    const newState: AttributedText<T>[] = []
    let index = 0
    let inserted = false
    for (const s of middleState) {
      const k = newLocation - index
      const insertLength = getInsertLength(s)
      if (k >= 0 && k <= insertLength && !inserted) {
        newState.push({
          attributes: s.attributes,
          insert: s.insert.slice(0, k),
        })
        newState.push(...newContents)
        index += contentLocation
        newState.push({
          attributes: s.attributes,
          insert: s.insert.slice(k),
        })
        inserted = true
      } else {
        newState.push(s)
      }
      index += insertLength
    }
    if (!inserted) {
      newState.push(...newContents)
    }
    props.setState(newState)
  }
  const deleteContentsInRange = (range: { min: number, max: number }) => {
    setLocation(range.min)
    setSelectionStart(undefined)
    const newState: AttributedText<T>[] = []
    let index = 0
    for (const s of props.state) {
      const kMin = range.min - index
      const kMax = range.max - index
      const insertLength = getInsertLength(s)
      if (kMin < 0) {
        if (kMax >= insertLength) {
          //
        } else if (kMax >= 0) {
          if (kMax < insertLength) {
            newState.push({
              attributes: s.attributes,
              insert: s.insert.slice(kMax),
            })
          }
        } else {
          newState.push(s)
        }
      } else if (kMin < insertLength) {
        if (kMin > 0) {
          newState.push({
            attributes: s.attributes,
            insert: s.insert.slice(0, kMin),
          })
        }
        if (kMax < insertLength) {
          newState.push({
            attributes: s.attributes,
            insert: s.insert.slice(kMax),
          })
        }
      } else {
        newState.push(s)
      }
      index += insertLength
    }
    return newState
  }
  const backspace = () => {
    if (props.readOnly) return
    if (range) {
      props.setState(deleteContentsInRange(range))
      return
    }
    if (location === 0) {
      return
    }
    const readonlyRange = readonlyRanges.find(r => location === r.max)
    if (readonlyRange) {
      setLocation(readonlyRange.min)
      props.setState(deleteContentsInRange(readonlyRange))
      return
    }
    setLocation(location - 1)
    const newState: AttributedText<T>[] = []
    let index = 0
    let deleted = false
    for (const s of props.state) {
      const k = location - index
      const insertLength = getInsertLength(s)
      if (k >= 0 && k <= insertLength && !deleted) {
        newState.push({
          attributes: s.attributes,
          insert: s.insert.slice(0, k - 1) + s.insert.slice(k),
        })
        deleted = true
      } else {
        newState.push(s)
      }
      index += insertLength
    }
    props.setState(newState)
  }
  const del = () => {
    if (props.readOnly) return
    if (range) {
      props.setState(deleteContentsInRange(range))
      return
    }
    if (location === layoutInput.length) {
      return
    }
    const readonlyRange = readonlyRanges.find(r => location === r.min)
    if (readonlyRange) {
      props.setState(deleteContentsInRange(readonlyRange))
      return
    }
    const newState: AttributedText<T>[] = []
    let index = 0
    let deleted = false
    for (const s of props.state) {
      const k = location - index + 1
      const insertLength = getInsertLength(s)
      if (k >= 0 && k <= insertLength && !deleted) {
        newState.push({
          attributes: s.attributes,
          insert: s.insert.slice(0, k - 1) + s.insert.slice(k),
        })
        deleted = true
      } else {
        newState.push(s)
      }
      index += insertLength
    }
    props.setState(newState)
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
    setLocation(getNewLocation({ location: location - 1 }, 'min'))
  }
  const arrowRight = (shift = false) => {
    if (!shift && range) {
      setSelectionStart(undefined)
      setLocation(range.max)
      return
    }
    if (location === layoutInput.length) {
      return
    }
    if (shift && selectionStart === undefined) {
      setSelectionStart(location)
    }
    setLocation(getNewLocation({ location: location + 1 }, 'max'))
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
    setLocation(getNewLocation(positionToLocation({
      x: cursorX,
      y: cursorY - lineHeights[cursorRow - 1] / 2 + scrollY,
    }, false), 'min'))
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
      setLocation(layoutInput.length)
      return
    }
    setLocation(getNewLocation(positionToLocation({
      x: cursorX,
      y: cursorY + lineHeights[cursorRow] + lineHeights[cursorRow + 1] / 2 + scrollY,
    }, false), 'max'))
  }
  const selectAll = () => {
    setSelectionStart(0)
    setLocation(layoutInput.length)
  }
  const getContentsInRange = (range: { min: number, max: number }) => {
    const newState: AttributedText<T>[] = []
    let index = 0
    for (const s of props.state) {
      const kMin = range.min - index
      const kMax = range.max - index
      const insertLength = getInsertLength(s)
      if (kMin < 0) {
        if (kMax >= insertLength) {
          newState.push(s)
        } else if (kMax >= 0) {
          if (kMax > 0) {
            newState.push({
              attributes: s.attributes,
              insert: s.insert.slice(0, kMax),
            })
          }
        } else {
          //
        }
      } else if (kMin < insertLength) {
        newState.push({
          attributes: s.attributes,
          insert: s.insert.slice(kMin, kMax),
        })
      } else {
        //
      }
      index += insertLength
    }
    return newState
  }
  const getCopiedContents = (cut = false) => {
    if (range === undefined) {
      return
    }
    const newState = getContentsInRange(range)
    if (cut) {
      props.setState(deleteContentsInRange(range))
    }
    return newState
  }
  const paste = () => {
    if (props.readOnly) return
    navigator.clipboard.readText().then(v => {
      if (v) {
        inputText(v)
        try {
          const contents: AttributedText<T>[] = JSON.parse(v)
          inputContent(contents, getAttributedTextSize(contents))
        } catch {
          inputText(v)
        }
      }
    })
  }
  const getInsertLength = (s: AttributedText<T>) => props.getReadonlyType?.(s.attributes) === true ? 1 : s.insert.length
  const setSelectedAttributes = (attributes: T | ((oldAttributes?: T) => T)) => {
    if (!range) {
      if (typeof attributes !== 'function') {
        if (currentAttributes?.index === location) {
          attributes = {
            ...currentAttributes.attributes,
            ...attributes,
          }
        }
        setCurrentAttributes({
          index: location,
          attributes,
        })
      }
      return
    }
    const getNewAttributes = (oldAttributes?: T) => {
      if (typeof attributes === 'function') {
        return attributes(oldAttributes)
      }
      return {
        ...oldAttributes,
        ...attributes,
      }
    }
    const newState: AttributedText<T>[] = []
    let index = 0
    for (const s of props.state) {
      const kMin = range.min - index
      const kMax = range.max - index
      const insertLength = getInsertLength(s)
      if (props.getReadonlyType?.(s.attributes) === true && kMin === 0) {
        newState.push({
          attributes: getNewAttributes(s.attributes),
          insert: s.insert,
        })
      } else if (kMin < 0) {
        if (kMax >= insertLength) {
          newState.push({
            insert: s.insert,
            attributes: getNewAttributes(s.attributes),
          })
        } else if (kMax >= 0) {
          if (kMax > 0) {
            newState.push({
              attributes: getNewAttributes(s.attributes),
              insert: s.insert.slice(0, kMax),
            })
          }
          if (kMax < insertLength) {
            newState.push({
              attributes: s.attributes,
              insert: s.insert.slice(kMax),
            })
          }
        } else {
          newState.push(s)
        }
      } else if (kMin < insertLength) {
        if (kMin > 0) {
          newState.push({
            attributes: s.attributes,
            insert: s.insert.slice(0, kMin),
          })
        }
        newState.push({
          attributes: getNewAttributes(s.attributes),
          insert: s.insert.slice(kMin, kMax),
        })
        if (kMax < insertLength) {
          newState.push({
            attributes: s.attributes,
            insert: s.insert.slice(kMax),
          })
        }
      } else {
        newState.push(s)
      }
      index += insertLength
    }
    props.setState(newState)
  }
  const onDoubleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const p = positionToLocation(getPosition(e)).location
    const { newSelectionStart, newLocation } = getWordByDoubleClick(layoutInput, p, c => c.insert)
    if (newSelectionStart !== undefined) setSelectionStart(getNewLocation({ location: newSelectionStart }, 'min'))
    if (newLocation !== undefined) setLocation(getNewLocation({ location: newLocation }, 'max'))
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) {
      onComposing(e, inputText, backspace)
      return
    }
    if (e.keyCode === 229) {
      onComposing(e, inputText, backspace)
      return
    }
    if (props.processInput?.(e)) {
      return
    }
    if (['CapsLock', 'Tab', 'Shift', 'Meta', 'Escape', 'Control'].includes(e.key)) return
    if (e.key === 'Backspace') return backspace()
    if (e.key === 'Delete') return del()
    if (e.key === 'ArrowLeft') return arrowLeft(e.shiftKey)
    if (e.key === 'ArrowRight') return arrowRight(e.shiftKey)
    if (e.key === 'ArrowUp') return arrowUp(e.shiftKey)
    if (e.key === 'ArrowDown') return arrowDown(e.shiftKey)
    if (e.key === 'Enter') return inputText('\n')
    if (metaKeyIfMacElseCtrlKey(e)) {
      if (e.key === 'a') return selectAll()
      if (e.key === 'v') {
        paste()
        e.preventDefault()
        return
      }
      if (e.key === 'c' || e.key === 'x') {
        const contents = getCopiedContents(e.key === 'x')
        if (contents) {
          navigator.clipboard.writeText(JSON.stringify(contents))
        }
        return
      }
    } else {
      e.preventDefault()
      if (e.key.length === 1) {
        inputText(e.key)
      }
    }
  }
  const onBlur = () => {
    props.onLocationChanged?.(-1)
    props.onBlur?.()
  }
  const downLocation = React.useRef<number>()
  const [dragLocation, setDragLocation] = React.useState<number>()
  const getPosition = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // type-coverage:ignore-next-line
    const bounding = (e.target as HTMLDivElement).getBoundingClientRect()
    return {
      x: e.clientX - bounding.left,
      y: e.clientY - bounding.top,
    }
  }
  const positionToLocation = (p: Position, ignoreInvisible = true): { location: number, fromRight?: boolean } => {
    const loc = getFlowLayoutLocation(p, lineHeights, layoutResult, scrollY, props.getWidth, ignoreInvisible)
    if (loc) {
      setLineEnd(loc.lineEnd)
      return loc
    }
    return { location: layoutResult.length - 1 }
  }
  const isPositionInRange = (p: Position) => {
    if (range) {
      for (let i = range.min; i < range.max; i++) {
        const r = layoutResult[i]
        if (p.x > r.x && p.y > r.y && p.x < r.x + props.getWidth(r.content) && p.y < r.y + lineHeights[r.row]) {
          return true
        }
      }
    }
    return false
  }
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const h = getPosition(e)
    const p = getNewLocation(positionToLocation(h), 'nearest')
    if (e.shiftKey) {
      if (selectionStart === undefined || Math.abs(selectionStart - p) < Math.abs(location - p)) {
        setSelectionStart(location)
      }
      setLocation(p)
    } else {
      if (isPositionInRange(h)) {
        setDragLocation(p)
        return
      }
      downLocation.current = p
    }
  }
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (downLocation.current === undefined) {
      if (dragLocation !== undefined) {
        setDragLocation(positionToLocation(getPosition(e), false).location)
      }
      return
    }
    const s = getPosition(e)
    const p = getNewLocation(positionToLocation(s, false), 'farthest')
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
    if (dragLocation !== undefined && range) {
      if (dragLocation < range.min) {
        inputContent(getContentsInRange(range), range.size, dragLocation)
        setSelectionStart(dragLocation)
      } else if (dragLocation > range.max) {
        inputContent(getContentsInRange(range), range.size, dragLocation - range.size)
        setSelectionStart(dragLocation - range.size)
      }
      setDragLocation(undefined)
    }
    ref.current?.focus()
  }
  useGlobalMouseUp(useEvent(() => {
    downLocation.current = undefined
    setDragLocation(undefined)
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

  const layoutInput: AttributedText<T>[] = []
  const readonlyRanges: { min: number, max: number, type?: string }[] = []
  for (const s of props.state) {
    const type = props.getReadonlyType?.(s.attributes)
    if (type) {
      const min = layoutInput.length
      const max = layoutInput.length + getInsertLength(s)
      if (type === true) {
        readonlyRanges.push({
          min,
          max,
        })
        layoutInput.push({ insert: s.insert, attributes: s.attributes })
        continue
      }
      const readonlyRange = readonlyRanges.find(r => r.type === type && r.max === min)
      if (readonlyRange) {
        readonlyRange.max = max
      } else {
        readonlyRanges.push({
          min,
          max,
          type,
        })
      }
    }
    for (const c of s.insert) {
      layoutInput.push({ insert: c, attributes: s.attributes })
    }
  }
  const getNewLocation = (p: { location: number, fromRight?: boolean }, type: 'min' | 'max' | 'nearest' | 'farthest') => {
    let readonlyRange: { min: number, max: number, type?: string } | undefined
    if (type === 'farthest' || type === 'nearest') {
      if (p.fromRight) {
        readonlyRange = readonlyRanges.find(r => !r.type && p.location === r.min)
      } else {
        readonlyRange = readonlyRanges.find(r => !r.type && p.location === r.max)
      }
    }
    if (!readonlyRange) {
      readonlyRange = readonlyRanges.find(r => p.location > r.min && p.location < r.max)
    }
    if (readonlyRange) {
      if (type === 'farthest') {
        const loc = downLocation.current ?? p.location
        return loc > (readonlyRange.max + readonlyRange.min) / 2 ? readonlyRange.min : readonlyRange.max
      }
      if (type === 'nearest') {
        return p.location > (readonlyRange.max + readonlyRange.min) / 2 ? readonlyRange.max : readonlyRange.min
      }
      return readonlyRange[type]
    }
    return p.location
  }
  const { layoutResult, newContentHeight, lineHeights } = flowLayout({
    state: layoutInput,
    width: props.width,
    height: props.autoHeight ? undefined : props.height,
    lineHeight: props.lineHeight,
    getWidth: props.getWidth,
    isNewLineContent: content => content.insert === '\n',
    isPartOfComposition: content => isWordCharactor(content.insert),
    getComposition: (index: number) => getTextComposition(index, layoutInput, props.getWidth, c => c.insert),
    endContent: { insert: '' },
    scrollY,
    align: props.align,
    verticalAlign: props.verticalAlign,
  })
  if (contentHeight < newContentHeight) {
    setContentHeight(newContentHeight)
  }
  const firstLineHeight = lineHeights[0]
  const lastLineHeight = lineHeights[lineHeights.length - 1]

  const range = selectionStart !== undefined ? { min: Math.min(selectionStart, location), max: Math.max(selectionStart, location), size: Math.abs(selectionStart - location) } : undefined
  let cursorLocation = dragLocation ?? location
  const cursorAtEnd = lineEnd && cursorLocation > 0 && layoutResult[cursorLocation - 1]
  if (cursorAtEnd) {
    cursorLocation--
  }
  const p = layoutResult[cursorLocation] ?? layoutResult[layoutResult.length - 1]
  const cursorX = p.x + (cursorAtEnd ? props.getWidth(layoutResult[cursorLocation].content) : 0)
  const cursorY = p.y - scrollY
  const cursorRow = p.row
  const cursorIndex = range ? range.min + 1 : location
  let cursorContent = layoutInput[cursorIndex > 0 ? cursorIndex - 1 : cursorIndex]
  if (currentAttributes && !range && currentAttributes.index === location) {
    cursorContent = {
      ...cursorContent,
      attributes: {
        ...cursorContent.attributes,
        ...currentAttributes.attributes,
      }
    }
  }

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
  React.useEffect(() => {
    if (currentAttributes && location !== currentAttributes?.index) {
      setCurrentAttributes(undefined)
    }
  }, [location, currentAttributes, setCurrentAttributes])

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
    inputText,
    inputContent,
    location,
    setLocation,
    getCopiedContents,
    isSelected,
    actualHeight,
    setSelectionStart,
    getPosition,
    positionToLocation,
    cursorContent,
    setSelectedAttributes,
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
          onCompositionEnd={e => {
            inputText(e.data, getCompositionCountThenEnd())
            if (ref.current) {
              ref.current.value = ''
            }
          }}
          onBlur={onBlur}
          onFocus={props.onFocus}
          readOnly={props.readOnly}
          autoFocus={props.autoFocus}
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
          onDoubleClick={onDoubleClick}
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

export interface AttributedText<T> {
  insert: string
  attributes?: T
}

function getAttributedTextSize<T>(state: AttributedText<T>[]) {
  let index = 0
  for (const s of state) {
    index += s.insert.length
  }
  return index
}
