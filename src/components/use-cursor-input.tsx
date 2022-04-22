import * as React from "react"
import { Position } from "../utils"

export function useCursorInput(
  enabled: boolean,
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, text: string, cursorPosition: Position) => void
) {
  const [text, setText] = React.useState('')
  const [cursorPosition, setCursorPosition] = React.useState<Position>()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  React.useEffect(() => {
    inputRef.current?.focus()
  })

  return {
    setCursorPosition,
    clearText() {
      setText('')
    },
    input: enabled && cursorPosition && (
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          position: 'absolute',
          left: `${cursorPosition.x + 10}px`,
          top: `${cursorPosition.y - 5}px`,
        }}
        onKeyDown={(e) => onKeyDown(e, text, cursorPosition)}
      />
    ),
  }
}
