
import * as React from "react"
import { Circle } from "../.."
import { getTwoPointsDistance, Position } from "../../utils"
import { getAngleSnapPosition } from "../../utils/snap"
import { EditOptions, useDragEdit } from "./use-edit"

/**
 * @public
 */
export function useCircleEdit<T = void>(
  onEnd: () => void,
  options?: EditOptions,
) {
  const [offset, setOffset] = React.useState<Circle & { data?: T }>({ x: 0, y: 0, r: 0 })
  const [cursorPosition, setCursorPosition] = React.useState<Position>()
  const { onStart, mask } = useDragEdit<{ type: 'center' | 'edge' } & Circle, T>(
    onEnd,
    (start, end) => {
      end = getAngleSnapPosition(start.data, end, options?.getAngleSnap)
      setCursorPosition(end)
      if (start.data.type === 'center') {
        const x = end.x - start.x
        const y = end.y - start.y
        setOffset({ x, y, r: 0, data: start.data.data })
      } else {
        const r = getTwoPointsDistance(end, start.data) - start.data.r
        setOffset({ x: 0, y: 0, r, data: start.data.data })
      }
    },
    () => setOffset({ x: 0, y: 0, r: 0 }),
    options,
  )

  return {
    cursorPosition,
    offset,
    onStart,
    mask,
  }
}
