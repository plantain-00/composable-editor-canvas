import type { WritableDraft } from "immer/dist/types/types-external"
import * as React from "react"
import { getTextSizeFromCache, Position } from "../utils"
import { metaKeyIfMacElseCtrlKey } from "./use-key"

/**
 * @public
 */
export function useFlowLayoutCursor<T extends { text: string, width: number }>(props: {
  state: readonly T[]
  width: number
  fontSize: number
  fontFamily: string
  lineHeight: number
  setState(recipe: (draft: WritableDraft<T>[]) => void): void
  getTextContent(text: string, width: number): WritableDraft<T>
  processInput?(e: React.KeyboardEvent<HTMLInputElement>): boolean
  onPaste?(e: React.ClipboardEvent<HTMLInputElement>): void
  onLocationChanged?(location: number): void
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
      y: cursorY - props.lineHeight / 2,
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
      y: cursorY + props.lineHeight * 3 / 2,
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
      y: e.clientY - bounding.top
    }
  }
  const positionToLocation = ({ x, y }: Position) => {
    const minY = y - props.lineHeight
    let result: number | undefined
    for (const p of iterateContentPosition()) {
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
    downLocation.current = positionToLocation(getPosition(e))
  }
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (downLocation.current === undefined) {
      return
    }
    const newLocation = positionToLocation(getPosition(e))
    if (newLocation === downLocation.current) {
      setLocation(newLocation)
      setSelectionStart(undefined)
    } else {
      setLocation(newLocation)
      setSelectionStart(downLocation.current)
    }
  }
  const onMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseMove(e)
    ref.current?.focus()
    downLocation.current = undefined
  }

  let cursorX = 0
  let cursorY = 0
  const range = selectionStart !== undefined ? { min: Math.min(selectionStart, location), max: Math.max(selectionStart, location) } : undefined
  for (let i = 0; i < location && i < props.state.length; i++) {
    const content = props.state[i]
    if (content.text === '\n') {
      cursorY += props.lineHeight
      cursorX = 0
      continue
    }
    if (cursorX + content.width > props.width) {
      cursorY += props.lineHeight
      cursorX = 0
    }
    cursorX += content.width
  }

  const iterateContentPosition = function* (): Generator<Position & { i: number, content: T }, void, unknown> {
    let x = 0
    let y = 0
    for (let i = 0; i < props.state.length; i++) {
      const content = props.state[i]
      if (content.text === '\n') {
        yield { x, y, i, content }
        y += props.lineHeight
        x = 0
        continue
      }
      if (x + content.width > props.width) {
        y += props.lineHeight
        x = 0
      }
      yield { x, y, i, content }
      x += content.width
    }
  }

  React.useEffect(() => {
    props.onLocationChanged?.(location)
  }, [location])

  return {
    inputText,
    arrowLeft,
    arrowRight,
    arrowUp,
    arrowDown,
    selectAll,
    getCopiedContents,
    onMouseDown,
    onMouseUp,
    onMouseMove,
    range,
    backspace,
    paste,
    iterateContentPosition,
    isSelected: (index: number) => range && index >= range.min && index < range.max,
    cursor: (
      <input
        autoFocus
        ref={ref}
        style={{
          border: 0,
          outline: 'none',
          width: '1px',
          position: 'absolute',
          left: cursorX + 'px',
          top: cursorY + 'px',
          fontSize: props.fontSize + 'px',
        }}
        onKeyDown={onKeyDown}
        onCompositionEnd={onCompositionEnd}
        onPaste={props.onPaste ?? onPaste}
        onBlur={onBlur}
      />
    ),
  }
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
