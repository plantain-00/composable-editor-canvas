import * as React from "react"
import { Ellipse, getAngleSnapPosition } from "../.."
import { getTwoPointsDistance, Position } from "../../utils"
import { EditOptions, useDragEdit } from "./use-edit"

/**
 * @public
 */
export function useEllipseEdit<T = void>(
  onEnd: () => void,
  options?: EditOptions,
) {
  const [offset, setOffset] = React.useState<Ellipse & { data?: T }>({ cx: 0, cy: 0, rx: 0, ry: 0 })
  const [cursorPosition, setCursorPosition] = React.useState<Position>()
  const { onStart, mask } = useDragEdit<{ type: 'center' | 'major axis' | 'minor axis' } & Ellipse, T>(
    onEnd,
    (start, end) => {
      end = getAngleSnapPosition({ x: start.data.cx, y: start.data.cy }, end, options?.getAngleSnap)
      setCursorPosition(end)
      if (start.data.type === 'center') {
        const cx = end.x - start.x
        const cy = end.y - start.y
        setOffset({ cx, cy, rx: 0, ry: 0, data: start.data.data })
      } else {
        const r = getTwoPointsDistance(end, { x: start.data.cx, y: start.data.cy })
        if (start.data.type === 'major axis') {
          setOffset({ cx: 0, cy: 0, rx: r - start.data.rx, ry: 0, data: start.data.data })
        } else {
          setOffset({ cx: 0, cy: 0, rx: 0, ry: r - start.data.ry, data: start.data.data })
        }
      }
    },
    () => setOffset({ cx: 0, cy: 0, rx: 0, ry: 0 }),
    options,
  )

  return {
    offset,
    onStart,
    mask,
    cursorPosition,
  }
}
