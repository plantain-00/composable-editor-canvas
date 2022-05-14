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
    getSnapPoint: (p: Position) => Position
    ignoreLeavingEvent: boolean
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
    onStartMove(p: Position, startPosition?: Partial<Position & { data: T }>) {
      setDragStartPosition({
        x: p.x - (startPosition?.x ?? 0),
        y: p.y - (startPosition?.y ?? 0),
        data: startPosition?.data,
      })
    },
    dragMoveMask: dragStartPosition && <DragMask
      ignoreLeavingEvent={options?.ignoreLeavingEvent}
      onDragging={(e) => {
        const p = { x: e.clientX, y: e.clientY }
        const f = options?.getSnapPoint?.(p) ?? p
        const x = (f.x - dragStartPosition.x) / scale
        const y = (f.y - dragStartPosition.y) / scale
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
