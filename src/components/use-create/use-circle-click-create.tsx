import * as React from "react"
import { Circle, getPointByLengthAndDirection, getThreePointsCircle, getTwoPointsDistance, Position, rotatePositionByCenter } from "../../utils/geometry"
import { useCursorInput } from "../use-cursor-input"
import { useKey } from "../use-key"

export function useCircleClickCreate(
  type: '2 points' | '3 points' | 'center radius' | 'center diameter' | undefined,
  onEnd: (circle: Circle) => void,
  options?: Partial<{
    getAngleSnap: (angle: number) => number | undefined
    message: string
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, text: string, cursorPosition: Position) => void
  }>,
) {
  const [circle, setCircle] = React.useState<Circle>()
  const [startPosition, setStartPosition] = React.useState<Position>()
  const [middlePosition, setMiddlePosition] = React.useState<Position>()
  let message = ''
  if (type) {
    if (startPosition) {
      if (type === '3 points') {
        message = middlePosition ? 'specify third point by click' : 'specify second point by click'
      } else {
        message = type === '2 points' ? 'specify second point by click, input position or input length' : 'specify circle edge point by click, input position or input length'
      }
    } else {
      message = type === '2 points' || type === '3 points' ? 'specify first point by click or input position' : 'specify circle center point by click or input position'
    }
    if (options?.message) {
      message = options.message
    }
  }

  const { input, setCursorPosition, clearText, cursorPosition, setInputPosition, resetInput } = useCursorInput(message, type === 'center radius' || type === 'center diameter' || type === '2 points' ? (e, text, cursorPosition) => {
    if (options?.onKeyDown) {
      options.onKeyDown(e, text, cursorPosition)
      return
    }
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
  } : undefined)

  const reset = () => {
    setStartPosition(undefined)
    setMiddlePosition(undefined)
    setCircle(undefined)
    resetInput()
  }

  useKey((e) => e.key === 'Escape', reset, [setStartPosition, setMiddlePosition])

  return {
    circle,
    startPosition,
    middlePosition,
    cursorPosition,
    setCursorPosition,
    setInputPosition,
    clearText,
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
      setInputPosition(viewportPosition ?? p)
      if (!type) {
        return
      }
      p = getAngleSnapPosition(startPosition, p, options?.getAngleSnap)
      setCursorPosition(p)
      if (startPosition) {
        const circle = getCircle(type, startPosition, middlePosition, p)
        if (circle) {
          setCircle(circle)
        }
      }
    },
    input,
    reset,
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
