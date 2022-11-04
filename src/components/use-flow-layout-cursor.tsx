import type { WritableDraft } from "immer/dist/types/types-external"
import * as React from "react"
import { getTextSizeFromCache, Position } from "../utils"
import { Scrollbar } from "./scrollbar"
import { metaKeyIfMacElseCtrlKey } from "./use-key"
import { useWheelScroll } from "./use-wheel-scroll"

/**
 * @public
 */
export function useFlowLayoutCursor<T extends { text: string, width: number }>(props: {
  state: readonly T[]
  width: number
  height: number
  fontSize: number
  fontFamily: string
  lineHeight: number
  setState(recipe: (draft: WritableDraft<T>[]) => void): void
  getTextContent(text: string, width: number): WritableDraft<T>
  processInput?(e: React.KeyboardEvent<HTMLInputElement>): boolean
  onPaste?(e: React.ClipboardEvent<HTMLInputElement>): void
  onLocationChanged?(location: number): void
  style?: React.CSSProperties
}) {
  const [location, setLocation] = React.useState(0)
  const [selectionStart, setSelectionStart] = React.useState<number>()
  const ref = React.useRef<HTMLInputElement | null>(null)

  const inputText = (text: string) => {
    const newCharacters = loadFlowLayoutText(text, props.fontSize, props.fontFamily, props.getTextContent)
    if (range) {
      setLocation(range.min + text.length)
      setSelectionStart(undefined)
      props.setState(draft => {
        draft.splice(range.min, range.max - range.min, ...newCharacters)
      })
      return
    }
    setLocation(location + text.length)
    props.setState(draft => {
      draft.splice(location, 0, ...newCharacters)
    })
  }
  const backspace = () => {
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
    if (cursorY < props.lineHeight) {
      setLocation(0)
      return
    }
    setLocation(positionToLocation({
      x: cursorX,
      y: cursorY - props.lineHeight / 2 + scrollY,
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
    setLocation(positionToLocation({
      x: cursorX,
      y: cursorY + props.lineHeight * 3 / 2 + scrollY,
    }))
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
  const paste = () => {
    navigator.clipboard.readText().then(v => {
      if (v) {
        inputText(v)
      }
    })
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault()
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
    if (e.key === 'Enter') return inputText('\n')
    if (e.key === 'Backspace') return backspace()
    if (e.key === 'ArrowLeft') return arrowLeft(e.shiftKey)
    if (e.key === 'ArrowRight') return arrowRight(e.shiftKey)
    if (e.key === 'ArrowUp') return arrowUp(e.shiftKey)
    if (e.key === 'ArrowDown') return arrowDown(e.shiftKey)
    if (metaKeyIfMacElseCtrlKey(e)) {
      if (e.key === 'a') return selectAll()
      if (e.key === 'v') return paste()
      if (e.key === 'c' || e.key === 'x') {
        const contents = getCopiedContents(e.key === 'x')
        if (contents) {
          navigator.clipboard.writeText(contents.map(c => c.text).join(''))
        }
        return
      }
    }
    inputText(e.key)
  }
  const onCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    inputText(e.data)
    if (ref.current) {
      ref.current.value = ''
    }
  }
  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    paste()
  }
  const onBlur = () => {
    setSelectionStart(undefined)
    props.onLocationChanged?.(-1)
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
  const positionToLocation = ({ x, y }: Position) => {
    const minY = y - props.lineHeight
    let result: number | undefined
    for (const p of layoutResult) {
      if (p.y >= minY && p.y <= y) {
        if (Math.abs(p.x - x) < p.content.width / 2) {
          return p.i
        }
        result = p.i
      } else if (result !== undefined) {
        return result
      }
    }
    return props.state.length
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
    const p = positionToLocation(getPosition(e))
    if (p === downLocation.current) {
      setLocation(p)
      setSelectionStart(undefined)
    } else {
      setLocation(p)
      setSelectionStart(downLocation.current)
    }
  }
  const onMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseMove(e)
    ref.current?.focus()
    downLocation.current = undefined
  }
  const onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const p = positionToLocation(getPosition(e))
    let start: number | undefined
    for (let i = p - 1; i >= 0; i--) {
      if (isWordCharactor(props.state[i].text)) {
        start = i
      } else {
        break
      }
    }
    let end: number | undefined
    for (let i = p; i < props.state.length; i++) {
      if (isWordCharactor(props.state[i].text)) {
        end = i + 1
      } else {
        break
      }
    }
    if (end !== undefined) {
      setSelectionStart(start ?? p)
      setLocation(end)
    } else if (start !== undefined) {
      setSelectionStart(start)
    }
  }

  const findWord = (index: number) => {
    let width = props.state[index].width
    for (let i = index + 1; i < props.state.length; i++) {
      const content = props.state[i]
      if (isWordCharactor(content.text)) {
        width += content.width
      } else {
        return {
          width,
          index: i,
        }
      }
    }
    return {
      width,
      index: props.state.length,
    }
  }
  const isVisible = (y: number) => y >= -props.lineHeight && y <= props.height

  const [contentHeight, setContentHeight] = React.useState(0)
  const { ref: scrollRef, y: scrollY, setY } = useWheelScroll<HTMLDivElement>({
    minY: contentHeight > props.height ? props.height - contentHeight : 0,
    maxY: 0,
  })
  const layoutResult: (Position & { i: number, content: T })[] = []
  {
    let x = 0
    let y = scrollY
    let i = 0
    let visible = isVisible(y)
    const toNewLine = () => {
      y += props.lineHeight
      visible = isVisible(y)
      x = 0
    }
    const addResult = (newLine: boolean) => {
      const content = props.state[i]
      if (visible) {
        layoutResult.push({ x, y, i, content })
      }
      if (newLine) {
        toNewLine()
      } else {
        x += content.width
      }
      i++
    }
    while (i < props.state.length) {
      const content = props.state[i]
      if (content.text === '\n') {
        addResult(true)
        continue
      }
      if (isWordCharactor(content.text)) {
        const w = findWord(i)
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
          if (x + props.state[i].width > props.width) {
            toNewLine()
          }
          addResult(false)
        }
        continue
      }
      // a|b
      if (x + content.width > props.width) {
        toNewLine()
      }
      addResult(false)
    }
    const newContentHeight = y + props.lineHeight - scrollY
    if (contentHeight < newContentHeight) {
      setContentHeight(newContentHeight)
    }
  }

  const range = selectionStart !== undefined ? { min: Math.min(selectionStart, location), max: Math.max(selectionStart, location) } : undefined
  const lastLayoutResult = layoutResult[layoutResult.length - 1]
  let cursorX = lastLayoutResult ? lastLayoutResult.x + lastLayoutResult.content.width : 0
  let cursorY = lastLayoutResult ? (lastLayoutResult.y - scrollY) : 0
  for (const p of layoutResult) {
    if (p.i === location) {
      cursorX = p.x
      cursorY = p.y - scrollY
      break
    }
  }

  const lastLocation = React.useRef<number>()
  React.useEffect(() => {
    if (lastLocation.current === location) {
      return
    }
    const y = cursorY + scrollY
    if (y < 0) {
      setY(-cursorY)
    } else if (y > props.height - props.lineHeight) {
      setY(props.height - props.lineHeight - cursorY)
    }
    lastLocation.current = location
  }, [location, cursorY])

  React.useEffect(() => {
    props.onLocationChanged?.(location)
  }, [location])

  return {
    layoutResult,
    isSelected: (index: number) => range && index >= range.min && index < range.max,
    scrollY,
    container: (children: React.ReactNode) => (
      <div
        style={{
          position: 'relative',
          width: props.width + 'px',
          height: props.height + 'px',
          border: '1px solid black',
          clipPath: 'inset(0px 0px)',
          ...props.style,
        }}
        onMouseLeave={onMouseUp}
        ref={scrollRef}
      >
        <input
          autoFocus
          ref={ref}
          style={{
            border: 0,
            outline: 'none',
            width: '1px',
            position: 'absolute',
            left: cursorX + 'px',
            top: cursorY + scrollY + 'px',
            fontSize: props.fontSize + 'px',
          }}
          onKeyDown={onKeyDown}
          onCompositionEnd={onCompositionEnd}
          onPaste={props.onPaste ?? onPaste}
          onBlur={onBlur}
        />
        <Scrollbar
          value={scrollY}
          type='vertical'
          containerSize={props.height}
          contentSize={contentHeight}
          onChange={setY}
          align='head'
        />
        {children}
        <div
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onDoubleClick={onDoubleClick}
          style={{ inset: '0px', cursor: 'text', position: 'absolute' }}
        ></div>
      </div>
    ),
  }
}

function isWordCharactor(c: string) {
  if (c === '.') return true
  if (c >= 'a' && c <= 'z') return true
  if (c >= 'A' && c <= 'Z') return true
  if (c >= '0' && c <= '9') return true
  return false
}

/**
 * @public
 */
export function loadFlowLayoutText<T>(
  text: string,
  fontSize: number,
  fontFamily: string,
  getTextContent: (text: string, width: number) => T,
) {
  const newCharacters: T[] = []
  for (const c of text) {
    const size = getTextSizeFromCache(`${fontSize}px ${fontFamily}`, c)
    if (size) {
      newCharacters.push(getTextContent(c, size.width))
    }
  }
  return newCharacters
}
