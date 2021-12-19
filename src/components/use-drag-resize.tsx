import * as React from "react"

import { DragMask, ResizeDirection, transformPosition } from "."

export function useDragResize(
  setResizeOffset: (offset: { x: number, y: number, width: number, height: number }) => void,
  onDragEnd: () => void,
  transform?: Partial<{
    containerSize: { width: number, height: number }
    targetSize: { width: number, height: number }
    x: number
    y: number
    scale: number
  }>,
) {
  const [dragStartPosition, setDragStartPosition] = React.useState<{ x: number, y: number, direction: ResizeDirection }>()

  return {
    onStartResize(e: React.MouseEvent<HTMLDivElement, MouseEvent>, direction: ResizeDirection) {
      const { x, y } = transformPosition(e.clientX, e.clientY, transform)
      setDragStartPosition({
        x,
        y,
        direction,
      })
    },
    dragResizeMask: dragStartPosition && <DragMask
      onDragging={(e) => {
        const { x: positionX, y: positionY } = transformPosition(e.clientX, e.clientY, transform)
        const offsetX = positionX - dragStartPosition.x
        const offsetY = positionY - dragStartPosition.y
        const offset = {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        }
        if (dragStartPosition.direction.includes('left')) {
          offset.width = -offsetX
          offset.x = offsetX
        }
        if (dragStartPosition.direction.includes('right')) {
          offset.width = offsetX
        }
        if (dragStartPosition.direction.includes('top')) {
          offset.height = -offsetY
          offset.y = offsetY
        }
        if (dragStartPosition.direction.includes('bottom')) {
          offset.height = offsetY
        }
        setResizeOffset(offset)
      }}
      onDragEnd={() => {
        onDragEnd()
        setDragStartPosition(undefined)
      }}
    />,
  }
}
