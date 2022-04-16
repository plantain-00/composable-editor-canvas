import * as React from "react"

import { useKey } from "."

export function useCircleClickCreate(
  type: '2 points' | '3 points' | 'center radius',
  setCircle: (circle?: { x: number, y: number, r: number }) => void,
  onEnd: () => void,
) {
  const [startPosition, setStartPosition] = React.useState<{ x: number, y: number }>()
  const [middlePosition, setMiddlePosition] = React.useState<{ x: number, y: number }>()
  useKey((e) => e.key === 'Escape', () => {
    setStartPosition(undefined)
    setMiddlePosition(undefined)
    setCircle(undefined)
  })
  return {
    onCircleClickCreateClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
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
      if (startPosition) {
        if (type === '2 points') {
          const x = (startPosition.x + e.clientX) / 2
          const y = (startPosition.y + e.clientY) / 2
          setCircle({
            x,
            y,
            r: Math.sqrt((x - startPosition.x) ** 2 + (y - startPosition.y) ** 2),
          })
        } else if (type === 'center radius') {
          setCircle({
            x: startPosition.x,
            y: startPosition.y,
            r: Math.sqrt((e.clientX - startPosition.x) ** 2 + (e.clientY - startPosition.y) ** 2),
          })
        } else if (middlePosition) {
          const x1 = 2 * (middlePosition.x - startPosition.x)
          const y1 = 2 * (middlePosition.y - startPosition.y)
          const x2 = 2 * (e.clientX - middlePosition.x)
          const y2 = 2 * (e.clientY - middlePosition.y)
          const t1 = middlePosition.x ** 2 - startPosition.x ** 2 + middlePosition.y ** 2 - startPosition.y ** 2
          const t2 = e.clientX ** 2 - middlePosition.x ** 2 + e.clientY ** 2 - middlePosition.y ** 2
          const x = (t1 * y2 - t2 * y1) / (x1 * y2 - x2 * y1)
          const y = (x2 * t1 - t2 * x1) / (x2 * y1 - y2 * x1)
          setCircle({
            x,
            y,
            r: Math.sqrt((x - startPosition.x) ** 2 + (y - startPosition.y) ** 2),
          })
        }
      }
    },
  }
}
