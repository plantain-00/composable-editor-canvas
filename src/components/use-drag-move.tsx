import * as React from "react"

import { DragMask, useKey } from "."

export function useDragMove<T = void>(
  setMoveOffset: (offset: { x: number, y: number }, e?: React.MouseEvent<HTMLDivElement, MouseEvent>) => void,
  onDragEnd?: () => void,
  options?: Partial<{
    scale: number
    parentRotate: number
  }>
) {
  const [dragStartPosition, setDragStartPosition] = React.useState<{ x: number, y: number, data?: T }>()
  const scale = options?.scale ?? 1
  const parentRotate = -(options?.parentRotate ?? 0) * Math.PI / 180

  useKey((e) => e.key === 'Escape', () => {
    setMoveOffset({ x: 0, y: 0 })
    setDragStartPosition(undefined)
  })

  return {
    dragMoveStartPosition: dragStartPosition,
    onStartMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>, startPosition?: Partial<{ x: number, y: number, data: T }>) {
      e.stopPropagation()
      setDragStartPosition({
        x: e.clientX - (startPosition?.x ?? 0),
        y: e.clientY - (startPosition?.y ?? 0),
        data: startPosition?.data,
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
