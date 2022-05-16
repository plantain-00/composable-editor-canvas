import * as React from "react"

import { useCursorInput, useKey } from ".."
import { Circle, getPointByLengthAndDirection, getThreePointsCircle, getTwoPointsDistance, Position, rotatePositionByCenter } from "../../utils"

export function useCircleClickCreate(
  type: '2 points' | '3 points' | 'center radius' | 'center diameter' | undefined,
  onEnd: (circle: Circle) => void,
  options?: Partial<{
    getAngleSnap: (angle: number) => number | undefined
  }>,
) {
  const [circle, setCircle] = React.useState<Circle>()
  const [startPosition, setStartPosition] = React.useState<Position>()
  const [middlePosition, setMiddlePosition] = React.useState<Position>()

  const { input, setCursorPosition, clearText, cursorPosition, setInputPosition } = useCursorInput(type === 'center radius' || type === 'center diameter' || type === '2 points', (e, text, cursorPosition) => {
    if (e.key === 'Enter') {
      const position = text.split(',')
      if (startPosition) {
        if (type === '2 points' && position.length === 2) {
          const offsetX = +position[0]
          const offsetY = +position[1]
          if (!isNaN(offsetX) && !isNaN(offsetY)) {
            const center = {
              x: startPosition.x + offsetX / 2,
              y: startPosition.y + offsetY / 2,
            }
            onEnd({
              ...center,
              r: getTwoPointsDistance(center, startPosition),
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
    setInputPosition(undefined)
  }

  useKey((e) => e.key === 'Escape', reset, [setStartPosition, setMiddlePosition])

  return {
    circle,
    startPosition,
    middlePosition,
    cursorPosition,
    setCursorPosition,
    onClick(p: Position) {
      if (!type) {
        return
      }
      setCursorPosition(p)
      if (!startPosition) {
        setStartPosition(p)
      } else if (type === '3 points' && !middlePosition) {
        setMiddlePosition(getAngleSnapPosition(startPosition, p, options?.getAngleSnap))
      } else {
        const circle = getCircle(type, startPosition, middlePosition, getAngleSnapPosition(startPosition, p, options?.getAngleSnap))
        if (circle) {
          onEnd(circle)
        }
        reset()
      }
    },
    onMove(p: Position, viewportPosition?: Position) {
      if (!type) {
        return
      }
      p = getAngleSnapPosition(startPosition, p, options?.getAngleSnap)
      setCursorPosition(p)
      setInputPosition(viewportPosition ?? p)
      if (startPosition) {
        const circle = getCircle(type, startPosition, middlePosition, p)
        if (circle) {
          setCircle(circle)
        }
      }
    },
    input,
  }
}

function getCircle(
  type: '2 points' | '3 points' | 'center radius' | 'center diameter',
  startPosition: Position,
  middlePosition: Position | undefined,
  endPosition: Position,
) {
  if (type === '2 points') {
    const center = {
      x: (startPosition.x + endPosition.x) / 2,
      y: (startPosition.y + endPosition.y) / 2,
    }
    return {
      ...center,
      r: getTwoPointsDistance(center, startPosition),
    }
  }
  if (type === 'center radius' || type === 'center diameter') {
    return {
      ...startPosition,
      r: getTwoPointsDistance(endPosition, startPosition),
    }
  }
  if (middlePosition) {
    return getThreePointsCircle(startPosition, middlePosition, endPosition)
  }
  return undefined
}


export function getAngleSnapPosition(
  startPosition: Position | undefined,
  newPosition: Position,
  getAngleSnap?: (angle: number) => number | undefined,
) {
  if (getAngleSnap && startPosition) {
    const angle = Math.atan2(newPosition.y - startPosition.y, newPosition.x - startPosition.x) * 180 / Math.PI
    const newAngle = getAngleSnap(angle)
    if (newAngle !== undefined && newAngle !== angle) {
      newPosition = rotatePositionByCenter(newPosition, startPosition, angle - newAngle)
    }
  }
  return newPosition
}
