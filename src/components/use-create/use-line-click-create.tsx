import * as React from "react"

import { getAngleSnapPosition, useCursorInput, useKey } from ".."
import { getPointByLengthAndDirection, getTwoPointsDistance, Position } from "../../utils"

/**
 * @public
 */
export function useLineClickCreate(
  enabled: boolean,
  onEnd: (line: Position[]) => void,
  options?: Partial<{
    once: boolean
    getAngleSnap: (angle: number) => number | undefined
    getLengthSnap: (angle: number) => number | undefined
  }>,
) {
  const [line, setLine] = React.useState<Position[]>()
  const [positions, setPositions] = React.useState<Position[]>([])
  const [tabSwitchIndex, setTabSwitchIndex] = React.useState(0)
  const [fixedAngle, setFixedAngle] = React.useState<number>()
  const [fixedLength, setFixedLength] = React.useState<number>()

  const inputMode = tabSwitchList[tabSwitchIndex]
  const nextTabSwitchIndex = (tabSwitchIndex + 1) % tabSwitchList.length
  const getAngleSnap = fixedAngle !== undefined ? () => fixedAngle : options?.getAngleSnap
  const getLengthSnap = fixedLength !== undefined ? () => fixedLength : options?.getAngleSnap
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
          clearText()
          if (line && line.length > 1) {
            const start = line[line.length - 2]
            const end = line[line.length - 1]
            let newPosition = getAngleSnapPosition(start, end, () => angle)
            newPosition = getLengthSnapPosition(start, newPosition, getLengthSnap)
            setPositions([...positions, newPosition])
            setLine([...positions, newPosition, { x: cursorPosition.x, y: cursorPosition.y }])
            setFixedAngle(undefined)
            setFixedLength(undefined)
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
          setFixedLength(undefined)
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
          setFixedLength(undefined)
        }
      }
    } else if (e.key === 'Tab') {
      e.stopPropagation()
      e.preventDefault()
      if (text) {
        const value = +text
        if (!isNaN(value)) {
          if (inputMode === 'angle') {
            setFixedAngle(value)
            setFixedLength(undefined)
            clearText()
          } else if (value > 0) {
            setFixedLength(value)
            setFixedAngle(undefined)
            clearText()
          }
        }
      }
      setTabSwitchIndex(nextTabSwitchIndex)
    }
  } : undefined)

  const reset = () => {
    setPositions([])
    setLine(undefined)
    resetInput()
    setFixedAngle(undefined)
    setFixedLength(undefined)
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
    inputMode,
    onClick(p: Position) {
      if (!enabled) {
        return
      }
      let newPosition = getAngleSnapPosition(positions[positions.length - 1], p, getAngleSnap)
      newPosition = getLengthSnapPosition(positions[positions.length - 1], newPosition, getLengthSnap)
      setCursorPosition(newPosition)
      setFixedAngle(undefined)
      setFixedLength(undefined)
      if (options?.once && positions.length > 0) {
        onEnd([positions[0], newPosition])
        reset()
        return
      }
      setPositions([...positions, newPosition])
    },
    onMove(p: Position, viewportPosition?: Position) {
      setInputPosition(viewportPosition || p)
      if (!enabled) {
        return
      }
      let newPosition = getAngleSnapPosition(positions[positions.length - 1], p, getAngleSnap)
      newPosition = getLengthSnapPosition(positions[positions.length - 1], newPosition, getLengthSnap)
      setCursorPosition(newPosition)
      if (options?.once && positions.length === 0) {
        return
      }
      setLine([...positions, newPosition])
    },
    input,
  }
}

const tabSwitchList = ['length', 'angle'] as const

function getLengthSnapPosition(
  startPosition: Position | undefined,
  newPosition: Position,
  getLengthSnap?: (length: number) => number | undefined,
) {
  if (getLengthSnap && startPosition) {
    const length = getTwoPointsDistance(startPosition, newPosition)
    const newLength = getLengthSnap(length)
    if (newLength !== undefined && newLength !== length) {
      newPosition = getPointByLengthAndDirection(startPosition, newLength, newPosition)
    }
  }
  return newPosition
}
