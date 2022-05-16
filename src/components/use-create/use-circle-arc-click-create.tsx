import * as React from "react"

import { useKey } from ".."
import { Arc, Position } from "../../utils"
import { getAngleSnapPosition, useCircleClickCreate } from "./use-circle-click-create"

export function useCircleArcClickCreate(
  type: '2 points' | '3 points' | 'center radius' | 'center diameter' | undefined,
  onEnd: (arc: Arc) => void,
  options?: Partial<{
    getAngleSnap: (angle: number) => number | undefined
  }>,
) {
  const [arc, setArc] = React.useState<Arc>()
  const [startAngle, setStartAngle] = React.useState<number>()

  const { circle, onClick, onMove, input, startPosition, middlePosition, cursorPosition, setCursorPosition } = useCircleClickCreate(
    type,
    (c) => setArc(c ? { ...c, startAngle: 0, endAngle: 0 } : undefined),
    options,
  )

  const reset = () => {
    setStartAngle(undefined)
    setCursorPosition(undefined)
    setArc(undefined)
  }

  useKey((e) => e.key === 'Escape', reset, [setArc, setStartAngle, setCursorPosition])

  return {
    circle,
    arc,
    startPosition,
    middlePosition,
    cursorPosition,
    onClick(p: Position) {
      if (!type) {
        return
      }
      if (arc) {
        p = getAngleSnapPosition(arc, p, options?.getAngleSnap)
        if (startAngle === undefined) {
          const angle = Math.atan2(p.y - arc.y, p.x - arc.x) * 180 / Math.PI
          setStartAngle(angle)
          setArc({ ...arc, startAngle: angle, endAngle: angle })
        } else {
          let angle = Math.atan2(p.y - arc.y, p.x - arc.x) * 180 / Math.PI
          if (angle < startAngle) {
            angle += 360
          }
          setArc(undefined)
          onEnd({ ...arc, startAngle, endAngle: angle })
          reset()
        }
      } else {
        onClick(p)
      }
    },
    onMove(p: Position, viewportPosition?: Position) {
      if (!type) {
        return
      }
      if (arc) {
        p = getAngleSnapPosition(arc, p, options?.getAngleSnap)
        setCursorPosition(p)
        if (startAngle !== undefined) {
          let angle = Math.atan2(p.y - arc.y, p.x - arc.x) * 180 / Math.PI
          if (angle < startAngle) {
            angle += 360
          }
          setArc({ ...arc, startAngle, endAngle: angle })
        }
      } else {
        onMove(p, viewportPosition)
      }
    },
    input,
  }
}
