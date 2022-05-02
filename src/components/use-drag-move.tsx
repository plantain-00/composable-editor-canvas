import * as React from "react"

import { DragMask, useKey } from "."
import { Position } from "../utils"

export function useDragMove<T = void>(
  setMoveOffset: (offset: Position, e?: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => void,
  onDragEnd?: () => void,
  options?: Partial<{
    scale: number
    parentRotate: number
    clone: boolean
    getSnapPoint: (p: { clientX: number, clientY: number }) => { clientX: number, clientY: number }
    propagation: boolean
  }>
) {
  const [dragStartPosition, setDragStartPosition] = React.useState<Position & { data?: T }>()
  const scale = options?.scale ?? 1
  const parentRotate = -(options?.parentRotate ?? 0) * Math.PI / 180

  useKey((e) => e.key === 'Escape', () => {
    setMoveOffset({ x: 0, y: 0 })
    setDragStartPosition(undefined)
  }, [setDragStartPosition])

  return {
    dragMoveStartPosition: dragStartPosition,
    onStartMove(e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, startPosition?: Partial<Position & { data: T }>) {
      if (!options?.propagation) {
        e.stopPropagation()
      }
      setDragStartPosition({
        x: e.clientX - (startPosition?.x ?? 0),
        y: e.clientY - (startPosition?.y ?? 0),
        data: startPosition?.data,
      })
    },
    dragMoveMask: dragStartPosition && <DragMask
      onDragging={(e) => {
        const f = options?.getSnapPoint?.(e) ?? e
        const x = (f.clientX - dragStartPosition.x) / scale
        const y = (f.clientY - dragStartPosition.y) / scale
        const sin = Math.sin(parentRotate)
        const cos = Math.cos(parentRotate)
        setMoveOffset({
          x: cos * x - sin * y,
          y: sin * x + cos * y,
        }, e)
      }}
      onDragEnd={() => {
        onDragEnd?.()
        if (options?.clone) return
        setMoveOffset({ x: 0, y: 0 })
        setDragStartPosition(undefined)
      }}
    />
  }
}
