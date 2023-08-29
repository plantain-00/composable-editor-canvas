import * as React from "react"
import { EllipseArc, getEllipseAngle, Position, rotatePositionByCenter } from "../../utils"
import { getAngleSnapPosition } from "../../utils/snap"
import { EditOptions, useDragEdit } from "./use-edit"

/**
 * @public
 */
export function useEllipseArcEdit<T = void>(
  onEnd: () => void,
  options?: EditOptions,
) {
  const [offset, setOffset] = React.useState<EllipseArc & { data?: T }>({ cx: 0, cy: 0, rx: 0, ry: 0, startAngle: 0, endAngle: 0 })
  const [cursorPosition, setCursorPosition] = React.useState<Position>()
  const { onStart, mask, reset } = useDragEdit<{ type: 'center' | 'start angle' | 'end angle' } & EllipseArc, T>(
    () => {
      setOffset({ cx: 0, cy: 0, rx: 0, ry: 0, startAngle: 0, endAngle: 0 })
      onEnd()
    },
    (start, end) => {
      end = getAngleSnapPosition({ x: start.data.cx, y: start.data.cy }, end, options?.getAngleSnap)
      setCursorPosition(end)
      if (start.data.type === 'center') {
        const cx = end.x - start.x
        const cy = end.y - start.y
        setOffset({ cx, cy, rx: 0, ry: 0, startAngle: 0, endAngle: 0, data: start.data.data })
      } else if (start.data.type === 'start angle') {
        const p = rotatePositionByCenter(end, { x: start.data.cx, y: start.data.cy }, start.data.angle ?? 0)
        const angle = getEllipseAngle(p, start.data) - start.data.startAngle
        setOffset({ cx: 0, cy: 0, rx: 0, ry: 0, startAngle: angle, endAngle: 0, data: start.data.data })
      } else if (start.data.type === 'end angle') {
        const p = rotatePositionByCenter(end, { x: start.data.cx, y: start.data.cy }, start.data.angle ?? 0)
        const angle = getEllipseAngle(p, start.data) - start.data.endAngle
        setOffset({ cx: 0, cy: 0, rx: 0, ry: 0, startAngle: 0, endAngle: angle, data: start.data.data })
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
      setOffset({ cx: 0, cy: 0, rx: 0, ry: 0, startAngle: 0, endAngle: 0 })
      reset()
    },
  }
}
