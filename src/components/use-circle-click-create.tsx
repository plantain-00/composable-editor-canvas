import * as React from "react"

import { useKey } from "."

export function useCircleClickCreate(
  type: '2 points' | '3 points' | 'center radius' | 'center diameter',
  setCircle: (circle?: { x: number, y: number, r: number }) => void,
  onEnd: (circle?: { x: number, y: number, r: number }) => void,
) {
  const [startPosition, setStartPosition] = React.useState<{ x: number, y: number }>()
  const [middlePosition, setMiddlePosition] = React.useState<{ x: number, y: number }>()
  useKey((e) => e.key === 'Escape', () => {
    setStartPosition(undefined)
    setMiddlePosition(undefined)
    setCircle(undefined)
  })

  const [text, setText] = React.useState('')
  const [cursorPosition, setCursorPosition] = React.useState<{ x: number, y: number }>()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  React.useEffect(() => {
    inputRef.current?.focus()
  })

  return {
    onCircleClickCreateClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
      setCursorPosition({ x: e.clientX, y: e.clientY })
      if (!startPosition) {
        setStartPosition({ x: e.clientX, y: e.clientY })
      } else if (type === '3 points' && !middlePosition) {
        setMiddlePosition({ x: e.clientX, y: e.clientY })
      } else {
        onEnd()
        setStartPosition(undefined)
        setMiddlePosition(undefined)
        setCircle(undefined)
      }
    },
    onCircleClickCreateMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
      setCursorPosition({ x: e.clientX, y: e.clientY })
      if (startPosition) {
        if (type === '2 points') {
          const x = (startPosition.x + e.clientX) / 2
          const y = (startPosition.y + e.clientY) / 2
          setCircle({
            x,
            y,
            r: Math.sqrt((x - startPosition.x) ** 2 + (y - startPosition.y) ** 2),
          })
        } else if (type === 'center radius' || type === 'center diameter') {
          setCircle({
            x: startPosition.x,
            y: startPosition.y,
            r: Math.sqrt((e.clientX - startPosition.x) ** 2 + (e.clientY - startPosition.y) ** 2),
          })
        } else if (middlePosition) {
          const x1 = middlePosition.x - startPosition.x
          const y1 = middlePosition.y - startPosition.y
          const x2 = e.clientX - middlePosition.x
          const y2 = e.clientY - middlePosition.y
          const t1 = middlePosition.x ** 2 - startPosition.x ** 2 + middlePosition.y ** 2 - startPosition.y ** 2
          const t2 = e.clientX ** 2 - middlePosition.x ** 2 + e.clientY ** 2 - middlePosition.y ** 2
          const x = (t1 * y2 - t2 * y1) / (x1 * y2 - x2 * y1) / 2
          const y = (x2 * t1 - t2 * x1) / (x2 * y1 - y2 * x1) / 2
          setCircle({
            x,
            y,
            r: Math.sqrt((x - startPosition.x) ** 2 + (y - startPosition.y) ** 2),
          })
        }
      }
    },
    circleClickCreateInput: (type === 'center radius' || type === 'center diameter' || type === '2 points') && cursorPosition && (
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          position: 'absolute',
          left: `${cursorPosition.x + 10}px`,
          top: `${cursorPosition.y - 5}px`,
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const position = text.split(',')
            if (startPosition) {
              if (type === '2 points' && position.length === 2) {
                const offsetX = +position[0]
                const offsetY = +position[1]
                if (!isNaN(offsetX) && !isNaN(offsetY)) {
                  const x = startPosition.x + offsetX / 2
                  const y = startPosition.y + offsetY / 2
                  onEnd({
                    x,
                    y,
                    r: Math.sqrt((x - startPosition.x) ** 2 + (y - startPosition.y) ** 2),
                  })
                  setStartPosition(undefined)
                  setMiddlePosition(undefined)
                  setCircle(undefined)
                  setText('')
                }
                return
              }
              const r = +text
              if (!isNaN(r) && r > 0) {
                let x = startPosition.x
                let y = startPosition.y
                if (type === '2 points') {
                  const dx = cursorPosition.x - startPosition.x
                  const dy = cursorPosition.y - startPosition.y
                  const offsetX = Math.sqrt((r / 2) ** 2 * dx ** 2 / (dx ** 2 + dy ** 2)) * (dx > 0 ? 1 : -1)
                  x += offsetX
                  y += dy / dx * offsetX
                }
                onEnd({
                  x,
                  y,
                  r: type === 'center diameter' || type === '2 points' ? r / 2 : r,
                })
                setStartPosition(undefined)
                setMiddlePosition(undefined)
                setCircle(undefined)
                setText('')
              }
            } else {
              if (position.length === 2) {
                const x = +position[0]
                const y = +position[1]
                if (!isNaN(x) && !isNaN(y)) {
                  setStartPosition({ x, y })
                  setText('')
                }
              }
            }
          }
        }}
      />
    ),
  }
}
