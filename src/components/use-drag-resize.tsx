import * as React from "react"

import { DragMask, ResizeDirection } from "."
import { transformPosition } from ".."

export function useDragResize(
  setResizeOffset: (offset: { x: number, y: number, width: number, height: number }) => void,
  centeredScaling: boolean | ((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => boolean),
  rotate: number,
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
  rotate = -rotate * Math.PI / 180

  return {
    dragResizeStartPosition: dragStartPosition,
    onStartResize(e: React.MouseEvent<HTMLDivElement, MouseEvent>, direction: ResizeDirection) {
      e.stopPropagation()
      const { x, y } = transformPosition({ x: e.clientX, y: e.clientY }, transform)
      setDragStartPosition({
        x,
        y,
        direction,
      })
    },
    dragResizeMask: dragStartPosition && <DragMask
      onDragging={(e) => {
        const { x: positionX, y: positionY } = transformPosition({ x: e.clientX, y: e.clientY }, transform)
        const originalOffsetX = positionX - dragStartPosition.x
        const originalOffsetY = positionY - dragStartPosition.y
        const sin = Math.sin(rotate)
        const cos = Math.cos(rotate)
        const offsetX = cos * originalOffsetX - sin * originalOffsetY
        const offsetY = sin * originalOffsetX + cos * originalOffsetY
        const isCenteredScaling = typeof centeredScaling === 'boolean' ? centeredScaling : centeredScaling(e)
        const offset = {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        }
        if (dragStartPosition.direction.includes('left')) {
          offset.width = -offsetX * (isCenteredScaling ? 2 : 1)
          if (isCenteredScaling) {
            offset.x += offsetX
          } else {
            offset.x += (cos + 1) * offsetX / 2
            offset.y -= sin * offsetX / 2
          }
        }
        if (dragStartPosition.direction.includes('right')) {
          offset.width = offsetX * (isCenteredScaling ? 2 : 1)
          if (isCenteredScaling) {
            offset.x += -offsetX
          } else {
            offset.x += (cos - 1) * offsetX / 2
            offset.y -= sin * offsetX / 2
          }
        }
        if (dragStartPosition.direction.includes('top')) {
          offset.height = -offsetY * (isCenteredScaling ? 2 : 1)
          if (isCenteredScaling) {
            offset.y += offsetY
          } else {
            offset.x += sin * offsetY / 2
            offset.y += (cos + 1) * offsetY / 2
          }
        }
        if (dragStartPosition.direction.includes('bottom')) {
          offset.height = offsetY * (isCenteredScaling ? 2 : 1)
          if (isCenteredScaling) {
            offset.y -= offsetY
          } else {
            offset.x += sin * offsetY / 2
            offset.y += (cos - 1) * offsetY / 2
          }
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
