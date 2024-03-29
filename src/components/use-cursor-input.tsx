import * as React from "react"
import { Position } from "../utils"

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
  React.useLayoutEffect(() => {
    const tagName = document.activeElement?.tagName
    if (tagName !== 'INPUT' && tagName !== 'TEXTAREA') {
      inputRef.current?.focus()
    }
  })

  const resetInput = () => {
    setCursorPosition(undefined)
    setInputPosition(undefined)
    setText('')
  }

  return {
    resetInput,
    cursorPosition,
    inputPosition,
    setCursorPosition,
    setInputPosition,
    clearText() {
      setText('')
    },
    input: inputPosition && (message || (onKeyDown && cursorPosition)) ? (
      <span
        style={{
          position: 'absolute',
          left: `${Math.min(inputPosition.x + 10, window.innerWidth - 54)}px`,
          top: `${Math.min(inputPosition.y - 5, window.innerHeight - 22)}px`,
        }}
      >
        {message && <span>{message}</span>}
        {onKeyDown && cursorPosition && <input
          ref={inputRef}
          value={text}
          autoComplete='false'
          style={{ width: '50px', opacity: options?.hideIfNoInput && !text ? 0 : undefined, ...options?.inputStyle }}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => onKeyDown(e, text, cursorPosition)}
        />}
      </span>
    ) : undefined,
  }
}
