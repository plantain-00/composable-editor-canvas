import * as React from "react"

import { Position } from "../.."
import { useEdit } from "./use-edit"

export function usePolylineEdit<T = void>(
  setPolylineOffset: (offset?: Position & { pointIndexes: number[], data?: T }) => void,
  onEditEnd: () => void,
  options?: Partial<{
    transform: (p: Position) => Position
  }>
) {
  const { onStartEdit, editMask } = useEdit<{ pointIndexes: number[] }, T>(
    onEditEnd,
    (start, end) => {
      const x = end.x - start.x
      const y = end.y - start.y
      setPolylineOffset({ x, y, pointIndexes: start.data.pointIndexes, data: start.data.data })
    },
    () => setPolylineOffset(undefined),
    options,
  )

  return {
    onStartEditPolyline(e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, pointIndexes: number[], data?: T) {
      onStartEdit(e, { pointIndexes, data, cursor: 'move' })
    },
    polylineEditMask: editMask,
  }
}
