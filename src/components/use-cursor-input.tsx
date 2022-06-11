import * as React from "react"
import { Position } from "../utils"
import { useKey } from "./use-key"

export function useCursorInput(
  message: string,
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>, text: string, cursorPosition: Position) => void,
  options?: Partial<{
    hideIfNoInput: boolean
    inputStyle: React.CSSProperties
  }>
) {
  const [text, setText] = React.useState('')
  const [cursorPosition, setCursorPosition] = React.useState<Position>()
  const [inputPosition, setInputPosition] = React.useState<Position>()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  React.useEffect(() => {
    inputRef.current?.focus()
  })

  const resetInput = () => {
    setCursorPosition(undefined)
    setInputPosition(undefined)
    setText('')
  }
  useKey((e) => e.key === 'Escape', resetInput, [setCursorPosition, setInputPosition, setText])

  return {
    resetInput,
    cursorPosition,
    inputPosition,
    setCursorPosition,
    setInputPosition,
    clearText() {
      setText('')
    },
    input: inputPosition ? (
      <span
        style={{
          position: 'absolute',
          left: `${inputPosition.x + 10}px`,
          top: `${inputPosition.y - 5}px`,
        }}
      >
        {message && <span>{message}</span>}
        {onKeyDown && cursorPosition && <input
          ref={inputRef}
          value={text}
          style={{ width: '50px', opacity: options?.hideIfNoInput && !text ? 0 : undefined, ...options?.inputStyle }}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => onKeyDown(e, text, cursorPosition)}
        />}
      </span>
    ) : undefined,
  }
}
