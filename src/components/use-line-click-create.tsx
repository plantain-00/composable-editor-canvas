import * as React from "react"

import { useCursorInput, useKey } from "."
import { getPointByLengthAndDirection, Position } from "../utils"

export function useLineClickCreate(
  enabled: boolean,
  setLine: (line?: Position[]) => void,
  onEnd: (line: Position[]) => void,
) {
  const [positions, setPositions] = React.useState<Position[]>([])
  const { input, setCursorPosition, clearText } = useCursorInput(enabled, (e, text, cursorPosition) => {
    if (e.key === 'Enter') {
      const position = text.split(',')
      if (position.length === 2) {
        const offsetX = +position[0]
        const offsetY = +position[1]
        if (!isNaN(offsetX) && !isNaN(offsetX)) {
          const lastPosition = positions[positions.length - 1] || { x: 0, y: 0 }
          const x = lastPosition.x + offsetX
          const y = lastPosition.y + offsetY
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
  }

  useKey((e) => e.key === 'Escape', () => {
    if (positions.length > 1) {
      onEnd(positions)
    }
    reset()
  }, [positions, setPositions])

  return {
    onLineClickCreateClick(e: React.MouseEvent<HTMLElement, MouseEvent>) {
      if (!enabled) {
        return
      }
      setCursorPosition({ x: e.clientX, y: e.clientY })
      setPositions([...positions, { x: e.clientX, y: e.clientY }])
    },
    onLineClickCreateMove(e: React.MouseEvent<HTMLElement, MouseEvent>) {
      if (!enabled) {
        return
      }
      setCursorPosition({ x: e.clientX, y: e.clientY })
      setLine([...positions, { x: e.clientX, y: e.clientY }])
    },
    lineClickCreateInput: input,
  }
}
