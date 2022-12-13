import * as React from "react"
import { Arc } from "../.."
import { getTwoPointsDistance, Position } from "../../utils"
import { getAngleSnapPosition } from "../../utils/snap"
import { EditOptions, useDragEdit } from "./use-edit"

/**
 * @public
 */
export function useCircleArcEdit<T = void>(
  onEnd: () => void,
  options?: EditOptions,
) {
  const [offset, setOffset] = React.useState<Arc & { data?: T }>({ x: 0, y: 0, r: 0, startAngle: 0, endAngle: 0 })
  const [cursorPosition, setCursorPosition] = React.useState<Position>()
  const { onStart, mask } = useDragEdit<{ type: 'center' | 'start angle' | 'end angle' | 'radius' } & Arc, T>(
    onEnd,
    (start, end) => {
      end = getAngleSnapPosition(start.data, end, options?.getAngleSnap)
      setCursorPosition(end)
      if (start.data.type === 'center') {
        const x = end.x - start.x
        const y = end.y - start.y
        setOffset({ x, y, r: 0, startAngle: 0, endAngle: 0, data: start.data.data })
      } else if (start.data.type === 'radius') {
        const r = getTwoPointsDistance(end, start.data) - start.data.r
        setOffset({ x: 0, y: 0, r, startAngle: 0, endAngle: 0, data: start.data.data })
      } else if (start.data.type === 'start angle') {
        const angle = Math.atan2(end.y - start.data.y, end.x - start.data.x) * 180 / Math.PI - start.data.startAngle
        setOffset({ x: 0, y: 0, r: 0, startAngle: angle, endAngle: 0, data: start.data.data })
      } else if (start.data.type === 'end angle') {
        const angle = Math.atan2(end.y - start.data.y, end.x - start.data.x) * 180 / Math.PI - start.data.endAngle
        setOffset({ x: 0, y: 0, r: 0, startAngle: 0, endAngle: angle, data: start.data.data })
      }
    },
    () => setOffset({ x: 0, y: 0, r: 0, startAngle: 0, endAngle: 0 }),
    options,
  )

  return {
    offset,
    onStart,
    mask,
    cursorPosition,
  }
}
