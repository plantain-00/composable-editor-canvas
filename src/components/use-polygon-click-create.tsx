import * as React from "react"

import { useCursorInput, useKey } from "."
import { getPointByLengthAndDirection, getPolygonPoints, Position, rotatePositionByCenter } from "../utils"

export function usePolygonClickCreate(
  enabled: boolean,
  setPolygon: (polygon?: Position[]) => void,
  onEnd: (polygon: Position[]) => void,
  options?: Partial<{
    toEdge: boolean
    getAngleSnap: (angle: number) => number | undefined
  }>,
) {
  const [startPosition, setStartPosition] = React.useState<Position>()
  const [inputType, setInputType] = React.useState<'radius' | 'sides'>('radius')
  const [sides, setSides] = React.useState(6)

  const { input, setCursorPosition, clearText, cursorPosition } = useCursorInput(enabled, (e, text, cursorPosition) => {
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
  })

  const reset = () => {
    setStartPosition(undefined)
    setPolygon(undefined)
    clearText()
    setCursorPosition(undefined)
  }

  useKey((e) => e.key === 'Escape', reset, [setStartPosition])

  React.useEffect(() => {
    if (startPosition && cursorPosition) {
      setPolygon(getPolygonPoints(cursorPosition, startPosition, sides, options?.toEdge))
    }
  }, [options?.toEdge])

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
    cursorPosition,
    onPolygonClickCreateClick(e: { clientX: number, clientY: number }) {
      if (!enabled) {
        return
      }
      setCursorPosition({ x: e.clientX, y: e.clientY })
      if (!startPosition) {
        setStartPosition({ x: e.clientX, y: e.clientY })
      } else {
        const newPosition = getAngleSnapPosition({ x: e.clientX, y: e.clientY })
        onEnd(getPolygonPoints(newPosition, startPosition, sides, options?.toEdge))
        reset()
      }
    },
    onPolygonClickCreateMove(e: { clientX: number, clientY: number }) {
      if (!enabled) {
        return
      }
      const newPosition = getAngleSnapPosition({ x: e.clientX, y: e.clientY })
      setCursorPosition(newPosition)
      if (startPosition) {
        setPolygon(getPolygonPoints(newPosition, startPosition, sides, options?.toEdge))
      }
    },
    polygonClickCreateInput: input,
    startSetSides() {
      setInputType('sides')
    }
  }
}
