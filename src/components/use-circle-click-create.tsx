import * as React from "react"

import { useCursorInput, useKey } from "."
import { Circle, getPointByLengthAndDirection, Position } from "../utils"

export function useCircleClickCreate(
  type: '2 points' | '3 points' | 'center radius' | 'center diameter' | undefined,
  setCircle: (circle?: Circle) => void,
  onEnd: (circle: Circle) => void,
) {
  const [startPosition, setStartPosition] = React.useState<Position>()
  const [middlePosition, setMiddlePosition] = React.useState<Position>()

  const { input, setCursorPosition, clearText } = useCursorInput(type === 'center radius' || type === 'center diameter' || type === '2 points', (e, text, cursorPosition) => {
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
            reset()
          }
          return
        }
        const r = +text
        if (!isNaN(r) && r > 0) {
          let x = startPosition.x
          let y = startPosition.y
          if (type === '2 points') {
            const point = getPointByLengthAndDirection(startPosition, r / 2, cursorPosition)
            x = point.x
            y = point.y
          }
          onEnd({
            x,
            y,
            r: type === 'center diameter' || type === '2 points' ? r / 2 : r,
          })
          reset()
        }
      } else {
        if (position.length === 2) {
          const x = +position[0]
          const y = +position[1]
          if (!isNaN(x) && !isNaN(y)) {
            setStartPosition({ x, y })
            if (type) {
              const circle = getCircle(type, { x, y }, undefined, cursorPosition)
              if (circle) {
                setCircle(circle)
              }
            }
            clearText()
          }
        }
      }
    }
  })

  const reset = () => {
    setStartPosition(undefined)
    setMiddlePosition(undefined)
    setCircle(undefined)
    clearText()
    setCursorPosition(undefined)
  }

  useKey((e) => e.key === 'Escape', reset, [setStartPosition, setMiddlePosition])

  return {
    onCircleClickCreateClick(e: React.MouseEvent<HTMLElement, MouseEvent>) {
      if (!type) {
        return
      }
      setCursorPosition({ x: e.clientX, y: e.clientY })
      if (!startPosition) {
        setStartPosition({ x: e.clientX, y: e.clientY })
      } else if (type === '3 points' && !middlePosition) {
        setMiddlePosition({ x: e.clientX, y: e.clientY })
      } else {
        const circle = getCircle(type, startPosition, middlePosition, { x: e.clientX, y: e.clientY })
        if (circle) {
          onEnd(circle)
        }
        reset()
      }
    },
    onCircleClickCreateMove(e: React.MouseEvent<HTMLElement, MouseEvent>) {
      if (!type) {
        return
      }
      setCursorPosition({ x: e.clientX, y: e.clientY })
      if (startPosition) {
        const circle = getCircle(type, startPosition, middlePosition, { x: e.clientX, y: e.clientY })
        if (circle) {
          setCircle(circle)
        }
      }
    },
    circleClickCreateInput: input,
  }
}

function getCircle(
  type: '2 points' | '3 points' | 'center radius' | 'center diameter',
  startPosition: Position,
  middlePosition: Position | undefined,
  endPosition: Position,
) {
  if (type === '2 points') {
    const x = (startPosition.x + endPosition.x) / 2
    const y = (startPosition.y + endPosition.y) / 2
    return {
      x,
      y,
      r: Math.sqrt((x - startPosition.x) ** 2 + (y - startPosition.y) ** 2),
    }
  }
  if (type === 'center radius' || type === 'center diameter') {
    return {
      x: startPosition.x,
      y: startPosition.y,
      r: Math.sqrt((endPosition.x - startPosition.x) ** 2 + (endPosition.y - startPosition.y) ** 2),
    }
  }
  if (middlePosition) {
    const x1 = middlePosition.x - startPosition.x
    const y1 = middlePosition.y - startPosition.y
    const x2 = endPosition.x - middlePosition.x
    const y2 = endPosition.y - middlePosition.y
    const t1 = middlePosition.x ** 2 - startPosition.x ** 2 + middlePosition.y ** 2 - startPosition.y ** 2
    const t2 = endPosition.x ** 2 - middlePosition.x ** 2 + endPosition.y ** 2 - middlePosition.y ** 2
    const x = (t1 * y2 - t2 * y1) / (x1 * y2 - x2 * y1) / 2
    const y = (x2 * t1 - t2 * x1) / (x2 * y1 - y2 * x1) / 2
    return {
      x,
      y,
      r: Math.sqrt((x - startPosition.x) ** 2 + (y - startPosition.y) ** 2),
    }
  }
  return undefined
}
