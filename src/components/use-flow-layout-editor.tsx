import * as React from "react"
import { ReactRenderTarget, useEvent, useGlobalMouseUp } from "."
import { getTextSizeFromCache, Position } from "../utils"
import { Scrollbar } from "./scrollbar"
import { metaKeyIfMacElseCtrlKey } from "./use-key"
import { useWheelScroll } from "./use-wheel-scroll"

/**
 * @public
 */
export function useFlowLayoutEditor(props: {
  state: readonly FlowLayoutText[]
  width: number
  height: number
  fontSize: number
  fontFamily: string
  lineHeight: number
  setState(recipe: (draft: FlowLayoutText[]) => void): void
  processInput?(e: React.KeyboardEvent<HTMLInputElement>): boolean
  onLocationChanged?(location: number): void
  style?: React.CSSProperties
  autoHeight?: boolean
  readOnly?: boolean
  onBlur?: () => void
  onFocus?: () => void
}) {
  const [location, setLocation] = React.useState(0)
  const [selectionStart, setSelectionStart] = React.useState<number>()
  const ref = React.useRef<HTMLInputElement | null>(null)
  const [contentHeight, setContentHeight] = React.useState(0)

  const inputText = (text: string | string[], textLocation = text.length) => {
    if (props.readOnly) return
    const newCharacters: FlowLayoutText[] = []
    if (Array.isArray(text)) {
      for (const t of text) {
        newCharacters.push(...loadFlowLayoutText(t, props.fontSize, props.fontFamily, true))
      }
    } else {
      newCharacters.push(...loadFlowLayoutText(text, props.fontSize, props.fontFamily))
    }
    if (range) {
      setLocation(range.min + textLocation)
      setSelectionStart(undefined)
      props.setState(draft => {
        draft.splice(range.min, range.max - range.min, ...newCharacters)
      })
      return
    }
    setLocation(location + textLocation)
    props.setState(draft => {
      draft.splice(location, 0, ...newCharacters)
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
    if (cursorY < props.lineHeight) {
      setLocation(0)
      return
    }
    setLocation(positionToLocation({
      x: cursorX,
      y: cursorY - props.lineHeight / 2 + scrollY,
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
    setLocation(positionToLocation({
      x: cursorX,
      y: cursorY + props.lineHeight * 3 / 2 + scrollY,
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
  const paste = () => {
    if (props.readOnly) return
    navigator.clipboard.readText().then(v => {
      if (v) {
        inputText(v)
      }
    })
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
    } else {
      e.preventDefault()
      inputText(e.key)
    }
  }
  const onCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    inputText(e.data)
    if (ref.current) {
      ref.current.value = ''
    }
  }
  const onBlur = () => {
    setSelectionStart(undefined)
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
  const positionToLocation = ({ x, y }: Position, ignoreInvisible = true) => {
    if (y < scrollY) {
      return 0
    }
    const minY = y - props.lineHeight
    let result: number | undefined
    for (const p of layoutResult) {
      if (ignoreInvisible && !p.visible) continue
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
    const s = getPosition(e)
    const p = positionToLocation(s, false)
    setLocation(p)
    if (p === downLocation.current) {
      setSelectionStart(undefined)
    } else {
      setSelectionStart(downLocation.current)
    }
    if (!props.autoHeight) {
      if (s.y >= 0 && s.y <= props.lineHeight) {
        setY(y => filterY(y + 2))
      } else if (s.y <= props.height && s.y >= props.height - props.lineHeight) {
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
  const isVisible = (y: number) => props.autoHeight ? true : y >= -props.lineHeight && y <= props.height

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

  const layoutResult: (Position & { i: number, content: FlowLayoutText, visible: boolean })[] = []
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
      layoutResult.push({ x, y, i, content, visible })
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
    layoutResult.push({ x, y, i, content: { text: '', width: 0 }, visible })
    const newContentHeight = y + props.lineHeight - scrollY
    if (contentHeight < newContentHeight) {
      setContentHeight(newContentHeight)
    }
  }

  const range = selectionStart !== undefined ? { min: Math.min(selectionStart, location), max: Math.max(selectionStart, location) } : undefined
  const p = layoutResult[location] ?? layoutResult[layoutResult.length - 1]
  const cursorX = p.x
  const cursorY = p.y - scrollY

  const lastLocation = React.useRef<number>()
  const lastCursorY = React.useRef<number>()
  React.useEffect(() => {
    if ((lastLocation.current === location && lastCursorY.current === cursorY) || props.autoHeight) {
      return
    }
    const y = cursorY + scrollY
    if (y < 0) {
      setY(-cursorY)
    } else if (y > props.height - props.lineHeight) {
      setY(props.height - props.lineHeight - cursorY)
    }
    lastLocation.current = location
    lastCursorY.current = cursorY
  }, [location, cursorY, scrollY])

  React.useEffect(() => {
    props.onLocationChanged?.(location)
  }, [location])

  let actualHeight = props.height
  if (props.autoHeight && contentHeight > props.height) {
    actualHeight = contentHeight
  }
  const isSelected = (index: number) => range && index >= range.min && index < range.max

  return {
    layoutResult,
    cursor: {
      x: cursorX,
      y: cursorY + scrollY,
    },
    inputText,
    location,
    setLocation,
    renderEditor: (renderProps: {
      target: ReactRenderTarget<unknown>,
      getTextColors?: (index: number) => { color?: number, backgroundColor?: number } | undefined,
      children?: unknown[],
    }) => {
      const children: unknown[] = []
      for (const { x, y, i, content, visible } of layoutResult) {
        if (!visible) continue
        const colors = renderProps.getTextColors?.(i) ?? {}
        if (isSelected(i)) {
          colors.backgroundColor = 0xB3D6FD
        }
        if (colors.backgroundColor !== undefined) {
          children.push(renderProps.target.renderRect(x, y, content.width, props.lineHeight, { fillColor: colors.backgroundColor, strokeWidth: 0 }))
        }
        children.push(renderProps.target.renderText(x + content.width / 2, y + props.fontSize, content.text, colors.color ?? 0x000000, props.fontSize, props.fontFamily, { textAlign: 'center' }))
      }
      if (renderProps.children) {
        children.push(...renderProps.children)
      }
      const result = renderProps.target.renderResult(children, props.width, actualHeight)
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
        <input
          ref={ref}
          style={{
            border: 0,
            outline: 'none',
            width: '1px',
            position: 'absolute',
            left: cursorX + 'px',
            top: cursorY + scrollY + 'px',
            fontSize: props.fontSize + 'px',
            opacity: props.readOnly ? 0 : undefined,
          }}
          onKeyDown={onKeyDown}
          onCompositionEnd={onCompositionEnd}
          onBlur={onBlur}
          onFocus={props.onFocus}
        />
        {result}
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

/**
 * @public
 */
export interface FlowLayoutText {
  text: string
  width: number
}

function isWordCharactor(c: string) {
  if (c === '.') return true
  if (isLetter(c)) return true
  if (isNumber(c)) return true
  return false
}

export function isLetter(c: string) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
}

export function isNumber(c: string) {
  return c >= '0' && c <= '9'
}

/**
 * @public
 */
export function loadFlowLayoutText(
  text: string,
  fontSize: number,
  fontFamily: string,
  whole = false,
) {
  const newCharacters: FlowLayoutText[] = []
  if (whole) {
    const size = getTextSizeFromCache(`${fontSize}px ${fontFamily}`, text)
    if (size) {
      newCharacters.push({ text, width: size.width })
    }
    return newCharacters
  }
  for (const c of text) {
    const size = getTextSizeFromCache(`${fontSize}px ${fontFamily}`, c)
    if (size) {
      newCharacters.push({ text: c, width: size.width })
    }
  }
  return newCharacters
}
