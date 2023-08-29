import * as React from "react"

import { Position } from "../.."
import { getAngleSnapPosition } from "../../utils/snap"
import { EditOptions, useDragEdit } from "./use-edit"

/**
 * @public
 */
export function usePolylineEdit<T = void>(
  onEnd: () => void,
  options?: EditOptions,
) {
  const [offset, setOffset] = React.useState<Position & { pointIndexes: number[], data?: T }>()
  const [cursorPosition, setCursorPosition] = React.useState<Position>()
  const { onStart, mask, dragStartPosition, reset } = useDragEdit<{ pointIndexes: number[] }, T>(
    () => {
      setOffset(undefined)
      onEnd()
    },
    (start, end) => {
      end = getAngleSnapPosition(start, end, options?.getAngleSnap)
      setCursorPosition(end)
      const x = end.x - start.x
      const y = end.y - start.y
      setOffset({ x, y, pointIndexes: start.data.pointIndexes, data: start.data.data })
    },
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
    reset() {
      setOffset(undefined)
      reset()
    },
  }
}
