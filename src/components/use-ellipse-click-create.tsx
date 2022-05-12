import * as React from "react"

import { useCursorInput, useKey } from "."
import { Ellipse, getPointByLengthAndDirection, getTwoPointsDistance, Position, rotatePositionByCenter } from "../utils"

export function useEllipseClickCreate(
  type: 'ellipse center' | 'ellipse endpoint' | undefined,
  setEllipse: (ellipse?: Ellipse) => void,
  onEnd: (ellipse: Ellipse) => void,
  options?: Partial<{
    getAngleSnap: (angle: number) => number | undefined
  }>,
) {
  const [startPosition, setStartPosition] = React.useState<Position>()
  const [middlePosition, setMiddlePosition] = React.useState<Position>()

  const { input, setCursorPosition, clearText, cursorPosition } = useCursorInput(!!type, (e, text, cursorPosition) => {
    if (e.key === 'Enter' && type) {
      const position = text.split(',')
      if (!startPosition) {
        if (position.length === 2) {
          const x = +position[0]
          const y = +position[1]
          if (!isNaN(x) && !isNaN(y)) {
            setStartPosition({ x, y })
            clearText()
          }
        }
        return
      }
      if (!middlePosition) {
        if (position.length === 2) {
          const x = +position[0]
          const y = +position[1]
          if (!isNaN(x) && !isNaN(y)) {
            setMiddlePosition({ x, y })
            clearText()
          }
        } else {
          const r = +text
          if (!isNaN(r) && r > 0) {
            setMiddlePosition(getPointByLengthAndDirection(startPosition, r, cursorPosition))
            clearText()
          }
        }
        return
      }
      if (position.length === 2) {
        const x = +position[0]
        const y = +position[1]
        if (!isNaN(x) && !isNaN(y)) {
          onEnd(getEllipse(type, startPosition, middlePosition, { x, y }))
          reset()
        }
      } else {
        const r = +text
        if (!isNaN(r) && r > 0) {
          onEnd(getEllipse(type, startPosition, middlePosition, r))
          reset()
        }
      }
    }
  })

  const reset = () => {
    setStartPosition(undefined)
    setMiddlePosition(undefined)
    setEllipse(undefined)
    clearText()
    setCursorPosition(undefined)
  }

  useKey((e) => e.key === 'Escape', reset, [setStartPosition, setMiddlePosition])

  const getAngleSnapPosition = (newPosition: { x: number, y: number }) => {
    if (options?.getAngleSnap && startPosition) {
      const angle = Math.atan2(newPosition.y - startPosition.y, newPosition.x - startPosition.x) * 180 / Math.PI
      const newAngle = options.getAngleSnap(angle)
      if (newAngle !== undefined && newAngle !== angle) {
        newPosition = rotatePositionByCenter(newPosition, startPosition, angle - newAngle)
      }
    }
    return newPosition
  }

  return {
    startPosition,
    middlePosition,
    cursorPosition,
    setCursorPosition,
    onEllipseClickCreateClick(e: { clientX: number, clientY: number }) {
      if (!type) {
        return
      }
      setCursorPosition({ x: e.clientX, y: e.clientY })
      if (!startPosition) {
        setStartPosition({ x: e.clientX, y: e.clientY })
      } else if (!middlePosition) {
        const newPosition = getAngleSnapPosition({ x: e.clientX, y: e.clientY })
        setMiddlePosition(newPosition)
      } else {
        onEnd(getEllipse(type, startPosition, middlePosition, { x: e.clientX, y: e.clientY }))
        reset()
      }
    },
    onEllipseClickCreateMove(e: { clientX: number, clientY: number }) {
      if (!type) {
        return
      }
      const newPosition = getAngleSnapPosition({ x: e.clientX, y: e.clientY })
      setCursorPosition(newPosition)
      if (startPosition && middlePosition) {
        setEllipse(getEllipse(type, startPosition, middlePosition, newPosition))
      }
    },
    ellipseClickCreateInput: input,
  }
}

function getEllipse(
  type: 'ellipse center' | 'ellipse endpoint',
  startPosition: Position,
  middlePosition: Position,
  endPosition: Position | number,
): Ellipse {
  const center = type === 'ellipse center'
    ? startPosition
    : {
      x: (startPosition.x + middlePosition.x) / 2,
      y: (startPosition.y + middlePosition.y) / 2,
    }
  return {
    cx: center.x,
    cy: center.y,
    rx: getTwoPointsDistance(center, middlePosition),
    ry: typeof endPosition === 'number' ? endPosition : getTwoPointsDistance(center, endPosition),
    angle: Math.atan2(middlePosition.y - center.y, middlePosition.x - center.x) * 180 / Math.PI,
  }
}
