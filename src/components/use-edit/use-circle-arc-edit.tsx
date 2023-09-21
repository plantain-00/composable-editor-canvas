import * as React from "react"
import { Arc } from "../.."
import { getTwoPointsRadian, getTwoPointsDistance, Position, radianToAngle } from "../../utils"
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
  const { onStart, mask, reset } = useDragEdit<{ type: 'center' | 'start angle' | 'end angle' | 'radius' } & Arc, T>(
    () => {
      setOffset({ x: 0, y: 0, r: 0, startAngle: 0, endAngle: 0 })
      onEnd()
    },
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
        const angle = radianToAngle(getTwoPointsRadian(end, start.data)) - start.data.startAngle
        setOffset({ x: 0, y: 0, r: 0, startAngle: angle, endAngle: 0, data: start.data.data })
      } else if (start.data.type === 'end angle') {
        const angle = radianToAngle(getTwoPointsRadian(end, start.data)) - start.data.endAngle
        setOffset({ x: 0, y: 0, r: 0, startAngle: 0, endAngle: angle, data: start.data.data })
      }
    },
    options,
  )

  return {
    offset,
    onStart,
    mask,
    cursorPosition,
    reset() {
      setOffset({ x: 0, y: 0, r: 0, startAngle: 0, endAngle: 0 })
      reset()
    },
  }
}
