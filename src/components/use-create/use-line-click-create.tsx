import * as React from "react"

import { useCursorInput, useKey } from ".."
import { getPointByLengthAndDirection, Position, rotatePositionByCenter } from "../../utils"

export function useLineClickCreate(
  enabled: boolean,
  setLine: (line?: Position[]) => void,
  onEnd: (line: Position[]) => void,
  options?: Partial<{
    once: boolean
    getAngleSnap: (angle: number) => number | undefined
  }>,
) {
  const [positions, setPositions] = React.useState<Position[]>([])
  const { input, setCursorPosition, clearText, setInputPosition } = useCursorInput(enabled, (e, text, cursorPosition) => {
    if (e.key === 'Enter') {
      const position = text.split(',')
      if (position.length === 2) {
        const offsetX = +position[0]
        const offsetY = +position[1]
        if (!isNaN(offsetX) && !isNaN(offsetX)) {
          const lastPosition = positions[positions.length - 1] || { x: 0, y: 0 }
          const x = lastPosition.x + offsetX
          const y = lastPosition.y + offsetY
          if (options?.once && positions.length > 0) {
            onEnd([positions[0], { x, y }])
            reset()
            return
          }
          setPositions([...positions, { x, y }])
          setLine([...positions, { x, y }, { x: cursorPosition.x, y: cursorPosition.y }])
          clearText()
        }
        return
      }
      if (positions.length > 0) {
        const length = +text
        if (!isNaN(length) && length > 0) {
          const point = getPointByLengthAndDirection(positions[positions.length - 1], length, cursorPosition)
          if (options?.once && positions.length > 0) {
            onEnd([positions[0], point])
            reset()
            return
          }
          setPositions([...positions, point])
          setLine([...positions, point, { x: cursorPosition.x, y: cursorPosition.y }])
          clearText()
        }
      }
    }
  })

  const reset = () => {
    setPositions([])
    setLine(undefined)
    clearText()
    setCursorPosition(undefined)
    setInputPosition(undefined)
  }

  useKey((e) => e.key === 'Escape', () => {
    if (positions.length > 1) {
      onEnd(positions)
    }
    reset()
  }, [positions, setPositions])

  const getAngleSnapPosition = (newPosition: { x: number, y: number }) => {
    if (options?.getAngleSnap && positions.length > 0) {
      const lastPoint = positions[positions.length - 1]
      const angle = Math.atan2(newPosition.y - lastPoint.y, newPosition.x - lastPoint.x) * 180 / Math.PI
      const newAngle = options.getAngleSnap(angle)
      if (newAngle !== undefined && newAngle !== angle) {
        newPosition = rotatePositionByCenter(newPosition, lastPoint, angle - newAngle)
      }
    }
    return newPosition
  }

  return {
    onLineClickCreateClick(p: Position) {
      if (!enabled) {
        return
      }
      const newPosition = getAngleSnapPosition(p)
      setCursorPosition(newPosition)
      if (options?.once && positions.length > 0) {
        onEnd([positions[0], newPosition])
        reset()
        return
      }
      setPositions([...positions, newPosition])
    },
    onLineClickCreateMove(p: Position, viewportPosition?: Position) {
      if (!enabled) {
        return
      }
      const newPosition = getAngleSnapPosition(p)
      setCursorPosition(newPosition)
      setInputPosition(viewportPosition || newPosition)
      if (options?.once && positions.length === 0) {
        return
      }
      setLine([...positions, newPosition])
    },
    lineClickCreateInput: input,
  }
}
