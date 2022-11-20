import React from "react"
import { Position } from "../../src"
import { RichText } from "./rich-text-editor"

export function useAt(cursor: Position, cursorHeight: number, inputText: (text: (string | RichText)[]) => void) {
  const [at, setAt] = React.useState('')
  const [atIndex, setAtIndex] = React.useState(0)
  const style = {
    color: 0xffffff,
    backgroundColor: 0x0000ff,
  }

  return {
    processAtInput(e: React.KeyboardEvent<HTMLInputElement>) {
      if (at) {
        if (e.key.length === 1 && e.key >= 'a' && e.key <= 'z') {
          setAt(a => a + e.key)
          e.preventDefault()
          return true
        }
        if (e.key === 'Enter' && at) {
          inputText([{ text: at + '_' + atIndex, ...style }, ' '])
          setAt('')
          return true
        }
        if (e.key === 'Escape') {
          setAt('')
          e.preventDefault()
          return true
        }
        if (e.key === 'ArrowDown') {
          setAtIndex((atIndex + 1) % 5)
          e.preventDefault()
          return true
        }
        if (e.key === 'ArrowUp') {
          setAtIndex((atIndex + 4) % 5)
          e.preventDefault()
          return true
        }
        if (e.key === 'Backspace') {
          if (at.length > 1) {
            setAt(a => a.slice(0, a.length - 1))
          } else {
            setAt('')
          }
          e.preventDefault()
          return true
        }
      }
      if (e.key === '@') {
        setAt('@')
        e.preventDefault()
        return true
      }
      return false
    },
    suggestions: at && <div
      style={{
        position: 'absolute',
        left: cursor.x + 'px',
        top: cursor.y + cursorHeight + 'px',
        background: 'white',
        width: '100px',
        border: '1px solid black',
      }}
    >
      <div>{at}</div>
      {new Array<number>(5).fill(0).map((_, i) => <div
        key={i}
        style={{ background: atIndex === i ? '#ccc' : undefined }}
        onMouseDown={(e) => {
          e.preventDefault()
          inputText([{ text: at + '_' + i, ...style }, ' '])
          setAt('')
        }}
      >
        {at + '_' + i}
      </div>)}
    </div>,
  }
}
