import * as React from "react"

import { useCursorInput, useKey } from "."
import { getPointByLengthAndDirection, getPolygonPoints, Position } from "../utils"

export function usePolygonClickCreate(
  enabled: boolean,
  setPolygon: (polygon?: Position[]) => void,
  onEnd: (polygon: Position[]) => void,
) {
  const [startPosition, setStartPosition] = React.useState<Position>()
  const [inputType, setInputType] = React.useState<'radius' | 'sides'>('radius')
  const [sides, setSides] = React.useState(6)

  const { input, setCursorPosition, clearText } = useCursorInput(enabled, (e, text, cursorPosition) => {
    if (e.key === 'Enter') {
      const r = +text
      if (!isNaN(r) && r > 0) {
        if (inputType === 'radius') {
          if (startPosition) {
            const point = getPointByLengthAndDirection(startPosition, r, cursorPosition)
            onEnd(getPolygonPoints(point, startPosition, sides))
            reset()
          }
        } else if (inputType === 'sides' && Number.isInteger(r) && r >= 3) {
          setSides(r)
          setInputType('radius')
          clearText()
          if (startPosition) {
            setPolygon(getPolygonPoints(cursorPosition, startPosition, r))
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

  return {
    onPolygonClickCreateClick(e: { clientX: number, clientY: number }) {
      if (!enabled) {
        return
      }
      setCursorPosition({ x: e.clientX, y: e.clientY })
      if (!startPosition) {
        setStartPosition({ x: e.clientX, y: e.clientY })
      } else {
        onEnd(getPolygonPoints({ x: e.clientX, y: e.clientY }, startPosition, sides))
        reset()
      }
    },
    onPolygonClickCreateMove(e: { clientX: number, clientY: number }) {
      if (!enabled) {
        return
      }
      setCursorPosition({ x: e.clientX, y: e.clientY })
      if (startPosition) {
        setPolygon(getPolygonPoints({ x: e.clientX, y: e.clientY }, startPosition, sides))
      }
    },
    polygonClickCreateInput: input,
    startSetSides() {
      setInputType('sides')
    }
  }
}
