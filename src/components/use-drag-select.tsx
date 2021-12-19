import * as React from "react"

import { DragMask } from "."

export function useDragSelect<T>(
  onDragEnd: (dragSelectStartPosition: { x: number, y: number, data: T }, dragSelectEndPosition?: { x: number, y: number }) => void,
) {
  const [dragStartPosition, setDragStartPosition] = React.useState<{ x: number, y: number, data: T }>()
  const [dragEndPosition, setDragEndPosition] = React.useState<{ x: number, y: number }>()

  return {
    dragSelectStartPosition: dragStartPosition,
    onStartSelect(e: React.MouseEvent<HTMLDivElement, MouseEvent>, data: T) {
      setDragStartPosition({
        x: e.clientX,
        y: e.clientY,
        data,
      })
    },
    dragSelectMask: dragStartPosition && <DragMask
      onDragging={(e) => {
        setDragEndPosition({
          x: e.clientX,
          y: e.clientY,
        })
      }}
      onDragEnd={() => {
        onDragEnd(dragStartPosition, dragEndPosition)
        setDragStartPosition(undefined)
        setDragEndPosition(undefined)
      }}
      style={{
        cursor: dragEndPosition ? 'crosshair' : 'default',
      }}
    >
      {dragEndPosition && <div
        style={{
          position: 'absolute',
          border: '1px dashed black',
          left: Math.min(dragStartPosition.x, dragEndPosition.x) + 'px',
          top: Math.min(dragStartPosition.y, dragEndPosition.y) + 'px',
          width: Math.abs(dragStartPosition.x - dragEndPosition.x) + 'px',
          height: Math.abs(dragStartPosition.y - dragEndPosition.y) + 'px',
        }}
      />}
    </DragMask>
  }
}
