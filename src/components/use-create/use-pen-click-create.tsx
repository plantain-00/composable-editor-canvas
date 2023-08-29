import { produce } from "immer"
import * as React from "react"

import { isSamePoint, pointIsOnLine, pointIsOnLineSegment, Position } from "../../utils"

/**
 * @public
 */
export function usePenClickCreate(
  enabled: boolean,
  onEnd: () => void,
) {
  const [points, setPoints] = React.useState<Position[]>([])
  const reset = () => {
    setPoints([])
  }

  return {
    points,
    onClick(p: Position) {
      if (!enabled) {
        return
      }
      if (points.length === 0) {
        setPoints([{ x: Math.round(p.x), y: Math.round(p.y) }])
        return
      }
      onEnd()
      reset()
    },
    onMove(p: Position) {
      if (!enabled || points.length === 0) {
        return
      }
      const last = points[points.length - 1]
      p = { x: Math.round(p.x), y: Math.round(p.y) }
      if (isSamePoint(last, p)) {
        return
      }
      if (points.length > 1) {
        const previous = points[points.length - 2]
        if (pointIsOnLine(last, previous, p) && pointIsOnLineSegment(last, previous, p)) {
          setPoints(produce(points, draft => {
            draft[points.length - 1] = p
          }))
          return
        }
      }
      setPoints(produce(points, draft => {
        draft.push(p)
      }))
    },
    reset,
  }
}
