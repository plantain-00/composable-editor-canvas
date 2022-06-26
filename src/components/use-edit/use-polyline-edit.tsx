import * as React from "react"

import { getAngleSnapPosition, Position } from "../.."
import { EditOptions, useEdit } from "./use-edit"

/**
 * @public
 */
export function usePolylineEdit<T = void>(
  onEnd: () => void,
  options?: EditOptions,
) {
  const [offset, setOffset] = React.useState<Position & { pointIndexes: number[], data?: T }>()
  const [cursorPosition, setCursorPosition] = React.useState<Position>()
  const { onStart, mask, dragStartPosition } = useEdit<{ pointIndexes: number[] }, T>(
    onEnd,
    (start, end) => {
      end = getAngleSnapPosition(start, end, options?.getAngleSnap)
      setCursorPosition(end)
      const x = end.x - start.x
      const y = end.y - start.y
      setOffset({ x, y, pointIndexes: start.data.pointIndexes, data: start.data.data })
    },
    () => setOffset(undefined),
    options,
  )

  return {
    offset,
    onStart(e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, pointIndexes: number[], data?: T) {
      onStart(e, { pointIndexes, data, cursor: 'move' })
    },
    mask,
    cursorPosition,
    dragStartPosition,
  }
}
