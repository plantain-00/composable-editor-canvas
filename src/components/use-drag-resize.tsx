import * as React from "react"

import { DragMask } from "."
import { getResizeCursor, ResizeDirection, Transform, transformPosition } from ".."

export function useDragResize(
  setResizeOffset: (offset: { x: number, y: number, width: number, height: number }) => void,
  onDragEnd: () => void,
  options?: Partial<{
    centeredScaling: boolean | ((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => boolean)
    keepRatio: number | undefined | ((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => number | undefined)
    rotate: number
    transform: Partial<Transform>
  }>,
) {
  const [dragStartPosition, setDragStartPosition] = React.useState<{ x: number, y: number, direction: ResizeDirection }>()
  const rotate = -(options?.rotate ?? 0) * Math.PI / 180

  return {
    dragResizeStartPosition: dragStartPosition,
    onStartResize(e: React.MouseEvent<HTMLDivElement, MouseEvent>, direction: ResizeDirection) {
      e.stopPropagation()
      const { x, y } = transformPosition({ x: e.clientX, y: e.clientY }, options?.transform)
      setDragStartPosition({
        x,
        y,
        direction,
      })
    },
    dragResizeMask: dragStartPosition && <DragMask
      onDragging={(e) => {
        const { x: positionX, y: positionY } = transformPosition({ x: e.clientX, y: e.clientY }, options?.transform)
        const originalOffsetX = positionX - dragStartPosition.x
        const originalOffsetY = positionY - dragStartPosition.y
        const sin = Math.sin(rotate)
        const cos = Math.cos(rotate)
        let offsetX = cos * originalOffsetX - sin * originalOffsetY
        let offsetY = sin * originalOffsetX + cos * originalOffsetY
        const scaleX = dragStartPosition.direction.includes('right') ? 1 : dragStartPosition.direction.includes('left') ? -1 : 0
        const scaleY = dragStartPosition.direction.includes('bottom') ? 1 : dragStartPosition.direction.includes('top') ? -1 : 0
        const isCenteredScaling = typeof options?.centeredScaling === 'boolean' ? options.centeredScaling : options?.centeredScaling?.(e)
        const ratio = typeof options?.keepRatio === 'number' ? options.keepRatio : options?.keepRatio?.(e)
        if (ratio) {
          const x = offsetX * scaleX
          const y = offsetY * scaleY
          offsetX = Math.min(y * ratio, x) * scaleX
          offsetY = Math.min(x / ratio, y) * scaleY
        }
        const offset = {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        }
        offset.width = offsetX * (isCenteredScaling ? 2 : 1) * scaleX
        offset.height = offsetY * (isCenteredScaling ? 2 : 1) * scaleY
        if (isCenteredScaling) {
          offset.x -= offsetX * scaleX
          offset.y -= offsetY * scaleY
        } else {
          if (dragStartPosition.direction.includes('left')) {
            offset.x += (cos + 1) * offsetX / 2
            offset.y -= sin * offsetX / 2
          }
          if (dragStartPosition.direction.includes('right')) {
            offset.x += (cos - 1) * offsetX / 2
            offset.y -= sin * offsetX / 2
          }
          if (dragStartPosition.direction.includes('top')) {
            offset.x += sin * offsetY / 2
            offset.y += (cos + 1) * offsetY / 2
          }
          if (dragStartPosition.direction.includes('bottom')) {
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
      style={{
        cursor: getResizeCursor(options?.rotate ?? 0, dragStartPosition.direction),
      }}
    />,
  }
}
