import * as React from "react"

import { DragMask } from "."

export function useDragMove(
  setMoveOffset: (offset: { x: number, y: number }, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void,
  onDragEnd?: () => void,
  options?: Partial<{
    scale: number
  }>
) {
  const [dragStartPosition, setDragStartPosition] = React.useState<{ x: number, y: number }>()
  const scale = options?.scale ?? 1

  return {
    dragMoveStartPosition: dragStartPosition,
    onStartMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>, startPosition?: Partial<{ x: number, y: number }>) {
      e.stopPropagation()
      setDragStartPosition({
        x: e.clientX - (startPosition?.x ?? 0),
        y: e.clientY - (startPosition?.y ?? 0),
      })
    },
    dragMoveMask: dragStartPosition && <DragMask
      onDragging={(e) => {
        setMoveOffset({
          x: (e.clientX - dragStartPosition.x) / scale,
          y: (e.clientY - dragStartPosition.y) / scale,
        }, e)
      }}
      onDragEnd={() => {
        onDragEnd?.()
        setDragStartPosition(undefined)
      }}
    />
  }
}
