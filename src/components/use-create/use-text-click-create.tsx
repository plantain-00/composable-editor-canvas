import * as React from "react"

import { useCursorInput, useKey } from ".."
import { Position, Text } from "../../utils"

/**
 * @public
 */
export function useTextClickCreate(
  enabled: boolean,
  onEnd: (text: Text) => void,
  options?: Partial<{
    scale: number
  }>,
) {
  const [text, setText] = React.useState<Text>()

  let message = ''
  if (enabled) {
    message = text ? 'specify text position' : 'input text'
  }

  const { input, setCursorPosition, clearText, setInputPosition, resetInput } = useCursorInput(message, enabled ? (e, text, p) => {
    if (e.key === 'Enter') {
      setText({
        x: p.x,
        y: p.y,
        text,
        color: 0xff0000,
        fontSize: 16 / (options?.scale ?? 1),
        fontFamily: 'monospace',
      })
      clearText()
    }
  } : undefined)

  const reset = () => {
    setText(undefined)
    resetInput()
  }

  useKey((e) => e.key === 'Escape', reset, [setText])

  return {
    text,
    onClick(p: Position) {
      if (!enabled || !text) {
        return
      }
      setCursorPosition(p)
      onEnd(text)
      reset()
    },
    onMove(p: Position, viewportPosition?: Position) {
      setInputPosition(viewportPosition || p)
      setCursorPosition(p)
      if (text) {
        setText({
          ...text,
          x: p.x,
          y: p.y,
        })
      }
    },
    input,
  }
}
