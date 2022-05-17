import * as React from "react"

import { getAngleSnapPosition, useCursorInput, useKey } from ".."
import { getPointByLengthAndDirection, getPolygonPoints, Position } from "../../utils"

export function usePolygonClickCreate(
  enabled: boolean,
  onEnd: (polygon: Position[]) => void,
  options?: Partial<{
    toEdge: boolean
    getAngleSnap: (angle: number) => number | undefined
  }>,
) {
  const [polygon, setPolygon] = React.useState<Position[]>()
  const [startPosition, setStartPosition] = React.useState<Position>()
  const [inputType, setInputType] = React.useState<'radius' | 'sides'>('radius')
  const [sides, setSides] = React.useState(6)

  let message = ''
  if (inputType === 'sides') {
    message = 'specify sides number by input'
  } else if (startPosition) {
    if (options?.toEdge) {
      message = 'specify edge point by click or input length'
    } else {
      message = 'specify end point by click or input length'
    }
  } else {
    message = 'specify center point by click'
  }
  const { input, setCursorPosition, clearText, cursorPosition, setInputPosition } = useCursorInput(message, enabled ? (e, text, cursorPosition) => {
    if (e.key === 'Enter') {
      const r = +text
      if (!isNaN(r) && r > 0) {
        if (inputType === 'radius') {
          if (startPosition) {
            const point = getPointByLengthAndDirection(startPosition, r, cursorPosition)
            onEnd(getPolygonPoints(point, startPosition, sides, options?.toEdge))
            reset()
          }
        } else if (inputType === 'sides' && Number.isInteger(r) && r >= 3) {
          setSides(r)
          setInputType('radius')
          clearText()
          if (startPosition) {
            setPolygon(getPolygonPoints(cursorPosition, startPosition, r, options?.toEdge))
          }
        }
      }
    }
  } : undefined)

  const reset = () => {
    setStartPosition(undefined)
    setPolygon(undefined)
    clearText()
    setCursorPosition(undefined)
    setInputPosition(undefined)
  }

  useKey((e) => e.key === 'Escape', reset, [setStartPosition])

  React.useEffect(() => {
    if (startPosition && cursorPosition) {
      setPolygon(getPolygonPoints(cursorPosition, startPosition, sides, options?.toEdge))
    }
  }, [options?.toEdge])

  return {
    polygon,
    startPosition,
    cursorPosition,
    onClick(p: Position) {
      if (!enabled) {
        return
      }
      setCursorPosition(p)
      if (!startPosition) {
        setStartPosition(p)
      } else {
        const newPosition = getAngleSnapPosition(startPosition, p, options?.getAngleSnap)
        onEnd(getPolygonPoints(newPosition, startPosition, sides, options?.toEdge))
        reset()
      }
    },
    onMove(p: Position, viewportPosition?: Position) {
      if (!enabled) {
        return
      }
      const newPosition = getAngleSnapPosition(startPosition, p, options?.getAngleSnap)
      setCursorPosition(newPosition)
      setInputPosition(viewportPosition || newPosition)
      if (startPosition) {
        setPolygon(getPolygonPoints(newPosition, startPosition, sides, options?.toEdge))
      }
    },
    input,
    startSetSides() {
      setInputType('sides')
    }
  }
}
