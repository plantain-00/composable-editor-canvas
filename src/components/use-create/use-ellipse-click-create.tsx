import * as React from "react"

import { getAngleSnapPosition, useCursorInput, useKey } from ".."
import { Ellipse, getPointByLengthAndDirection, getTwoPointsDistance, Position } from "../../utils"

export function useEllipseClickCreate(
  type: 'ellipse center' | 'ellipse endpoint' | undefined,
  onEnd: (ellipse: Ellipse) => void,
  options?: Partial<{
    getAngleSnap: (angle: number) => number | undefined
  }>,
) {
  const [ellipse, setEllipse] = React.useState<Ellipse>()
  const [startPosition, setStartPosition] = React.useState<Position>()
  const [middlePosition, setMiddlePosition] = React.useState<Position>()

  const { input, setCursorPosition, clearText, cursorPosition, setInputPosition } = useCursorInput(!!type, (e, text, cursorPosition) => {
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
    setInputPosition(undefined)
  }

  useKey((e) => e.key === 'Escape', reset, [setStartPosition, setMiddlePosition])

  return {
    ellipse,
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
      } else if (!middlePosition) {
        const newPosition = getAngleSnapPosition(startPosition, p, options?.getAngleSnap)
        setMiddlePosition(newPosition)
      } else {
        const center = type === 'ellipse center'
          ? startPosition
          : {
            x: (startPosition.x + middlePosition.x) / 2,
            y: (startPosition.y + middlePosition.y) / 2,
          }
        p = getAngleSnapPosition(center, p, options?.getAngleSnap)
        onEnd(getEllipse(type, startPosition, middlePosition, p))
        reset()
      }
    },
    onMove(p: Position, viewportPosition?: Position) {
      if (!type) {
        return
      }
      let newPosition: Position
      if (startPosition && middlePosition) {
        const center = type === 'ellipse center'
          ? startPosition
          : {
            x: (startPosition.x + middlePosition.x) / 2,
            y: (startPosition.y + middlePosition.y) / 2,
          }
        newPosition = getAngleSnapPosition(center, p, options?.getAngleSnap)
      } else {
        newPosition = getAngleSnapPosition(startPosition, p, options?.getAngleSnap)
      }
      setCursorPosition(newPosition)
      setInputPosition(viewportPosition || newPosition)
      if (startPosition && middlePosition) {
        setEllipse(getEllipse(type, startPosition, middlePosition, newPosition))
      }
    },
    input,
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
