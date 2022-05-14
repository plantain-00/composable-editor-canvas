import * as React from "react"
import { Position } from "../utils"

export function useCursorInput(
  enabled: boolean,
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, text: string, cursorPosition: Position) => void
) {
  const [text, setText] = React.useState('')
  const [cursorPosition, setCursorPosition] = React.useState<Position>()
  const [inputPosition, setInputPosition] = React.useState<Position>()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  React.useEffect(() => {
    inputRef.current?.focus()
  })

  return {
    cursorPosition,
    setCursorPosition,
    setInputPosition,
    clearText() {
      setText('')
    },
    input: enabled && inputPosition && cursorPosition ? (
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          position: 'absolute',
          left: `${inputPosition.x + 10}px`,
          top: `${inputPosition.y - 5}px`,
        }}
        onKeyDown={(e) => onKeyDown(e, text, cursorPosition)}
      />
    ) : undefined,
  }
}
