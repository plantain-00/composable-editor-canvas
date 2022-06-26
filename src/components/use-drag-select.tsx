import * as React from "react"

import { DragMask, useKey } from "."
import { Position } from "../utils"

/**
 * @public
 */
export function useDragSelect<T = void>(
  onDragEnd: (dragSelectStartPosition: Position & { data?: T }, dragSelectEndPosition?: Position) => void,
  square?: boolean | ((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => boolean),
) {
  const [dragStartPosition, setDragStartPosition] = React.useState<Position & { data?: T }>()
  const [dragEndPosition, setDragEndPosition] = React.useState<Position>()
  useKey((e) => e.key === 'Escape', () => {
    setDragStartPosition(undefined)
    setDragEndPosition(undefined)
  }, [setDragStartPosition, setDragEndPosition])
  return {
    dragSelectStartPosition: dragStartPosition,
    onStartSelect(e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, data?: T) {
      setDragStartPosition({
        x: e.clientX,
        y: e.clientY,
        data,
      })
    },
    dragSelectMask: dragStartPosition && <DragMask
      onDragging={(e) => {
        const isSquare = typeof square === 'boolean' ? square : square ? square(e) : undefined
        if (isSquare) {
          const offsetX = e.clientX - dragStartPosition.x
          const offsetY = e.clientY - dragStartPosition.y
          const offset = Math.min(Math.abs(offsetX), Math.abs(offsetY))
          setDragEndPosition({
            x: offsetX > 0 ? dragStartPosition.x + offset : dragStartPosition.x - offset,
            y: offsetY > 0 ? dragStartPosition.y + offset : dragStartPosition.y - offset,
          })
          return
        }
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
