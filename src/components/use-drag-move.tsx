import * as React from "react"

import { DragMask } from "."

export function useDragMove(
  setMoveOffset: (offset: { x: number, y: number }) => void,
  scale = 1,
  onDragEnd?: () => void,
) {
  const [dragStartPosition, setDragStartPosition] = React.useState<{ x: number, y: number }>()

  return {
    dragMoveStartPosition: dragStartPosition,
    onStartMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>, startPosition?: Partial<{ x: number, y: number }>) {
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
        })
      }}
      onDragEnd={() => {
        onDragEnd?.()
        setDragStartPosition(undefined)
      }}
    />
  }
}
