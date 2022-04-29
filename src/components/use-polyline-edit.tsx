import * as React from "react"

import { DragMask, useKey } from "."
import { Position } from ".."

export function usePolylineEdit<T = void>(
  setPolylineOffset: (offset?: Position & { pointIndexes: number[], data?: T }) => void,
  onEditEnd: () => void,
) {
  const [dragStartPosition, setDragStartPosition] = React.useState<Position & { pointIndexes: number[], data?: T }>()

  useKey((e) => e.key === 'Escape', () => {
    setPolylineOffset(undefined)
    setDragStartPosition(undefined)
  }, [setDragStartPosition])

  return {
    onStartEditPolyline(e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>,  pointIndexes: number[], data?: T) {
      e.stopPropagation()
      setDragStartPosition({
        x: e.clientX,
        y: e.clientY,
        pointIndexes,
        data,
      })
    },
    polylineEditMask: dragStartPosition && <DragMask
      onDragging={(e) => {
        e.stopPropagation()
        const x = e.clientX - dragStartPosition.x
        const y = e.clientY - dragStartPosition.y
        setPolylineOffset({ x, y, pointIndexes: dragStartPosition.pointIndexes, data: dragStartPosition.data })
      }}
      onDragEnd={() => {
        onEditEnd()
        setPolylineOffset(undefined)
        setDragStartPosition(undefined)
      }}
      style={{
        cursor: 'move',
      }}
    />,
  }
}
