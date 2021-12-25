import * as React from "react"

import { DragMask } from "."

export function useDragMove(
  setMoveOffset: (offset: { x: number, y: number }, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void,
  onDragEnd?: () => void,
  options?: Partial<{
    scale: number
    parentRotate: number
  }>
) {
  const [dragStartPosition, setDragStartPosition] = React.useState<{ x: number, y: number }>()
  const scale = options?.scale ?? 1
  const parentRotate = -(options?.parentRotate ?? 0) * Math.PI / 180

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
        const x = (e.clientX - dragStartPosition.x) / scale
        const y = (e.clientY - dragStartPosition.y) / scale
        const sin = Math.sin(parentRotate)
        const cos = Math.cos(parentRotate)
        setMoveOffset({
          x: cos * x - sin * y,
          y: sin * x + cos * y,
        }, e)
      }}
      onDragEnd={() => {
        onDragEnd?.()
        setDragStartPosition(undefined)
      }}
    />
  }
}
