import * as React from "react"

import { getAngleSnapPosition, useCursorInput, useKey } from ".."
import { getPointByLengthAndDirection, Position } from "../../utils"

export function useLineClickCreate(
  enabled: boolean,
  onEnd: (line: Position[]) => void,
  options?: Partial<{
    once: boolean
    getAngleSnap: (angle: number) => number | undefined
  }>,
) {
  const [line, setLine] = React.useState<Position[]>()
  const [positions, setPositions] = React.useState<Position[]>([])
  const [tabSwitchIndex, setTabSwitchIndex] = React.useState(0)
  const [fixedAngle, setFixedAngle] = React.useState<number>()

  const inputMode = tabSwitchList[tabSwitchIndex]
  const nextTabSwitchIndex = (tabSwitchIndex + 1) % tabSwitchList.length
  const getAngleSnap = fixedAngle !== undefined ? () => fixedAngle : options?.getAngleSnap
  let message = ''
  if (line) {
    if (line.length === 1) {
      message = 'specify start point by click, input position'
    } else {
      message = `specify next point by click, input position or input ${inputMode}, press tab to input ${tabSwitchList[nextTabSwitchIndex]}`
    }
  }
  const { input, setCursorPosition, clearText, setInputPosition, resetInput } = useCursorInput(message, enabled ? (e, text, cursorPosition) => {
    if (e.key === 'Enter') {
      if (inputMode === 'angle') {
        const angle = +text
        if (!isNaN(angle)) {
          setFixedAngle(angle)
          setTabSwitchIndex(0)
          clearText()
          if (line && line.length > 1) {
            const start = line[line.length - 2]
            const end = line[line.length - 1]
            const newPosition = getAngleSnapPosition(start, end, () => angle)
            setLine([...positions, newPosition])
          }
        }
        return
      }
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
          setFixedAngle(undefined)
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
          setFixedAngle(undefined)
        }
      }
    } else if (e.key === 'Tab') {
      e.stopPropagation()
      e.preventDefault()
      setTabSwitchIndex(nextTabSwitchIndex)
    }
  } : undefined)

  const reset = () => {
    setPositions([])
    setLine(undefined)
    resetInput()
    setFixedAngle(undefined)
    setTabSwitchIndex(0)
  }

  useKey((e) => e.key === 'Escape', () => {
    if (positions.length > 1) {
      onEnd(positions)
    }
    reset()
  }, [positions, setPositions])

  return {
    line,
    onClick(p: Position) {
      if (!enabled) {
        return
      }
      const newPosition = getAngleSnapPosition(positions[positions.length - 1], p, getAngleSnap)
      setCursorPosition(newPosition)
      setFixedAngle(undefined)
      if (options?.once && positions.length > 0) {
        onEnd([positions[0], newPosition])
        reset()
        return
      }
      setPositions([...positions, newPosition])
    },
    onMove(p: Position, viewportPosition?: Position) {
      if (!enabled) {
        return
      }
      const newPosition = getAngleSnapPosition(positions[positions.length - 1], p, getAngleSnap)
      setCursorPosition(newPosition)
      setInputPosition(viewportPosition || newPosition)
      if (options?.once && positions.length === 0) {
        return
      }
      setLine([...positions, newPosition])
    },
    input,
  }
}

const tabSwitchList = ['length', 'angle'] as const
