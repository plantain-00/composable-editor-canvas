import * as React from "react"

import { DragMask, getAngleSnapPosition, useKey } from "."
import { Position } from "../utils"

export function useDragMove<T = void>(
  onDragEnd?: () => void,
  options?: Partial<{
    scale: number
    parentRotate: number
    repeatedly: boolean
    transform: (p: Position) => Position
    ignoreLeavingEvent: boolean
    transformOffset: (p: Position, e?: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => Position
    getAngleSnap: (angle: number) => number | undefined
  }>
) {
  const [offset, setOffset] = React.useState<Position>({ x: 0, y: 0 })
  const [dragStartPosition, setDragStartPosition] = React.useState<Position & { data?: T }>()
  const scale = options?.scale ?? 1
  const parentRotate = -(options?.parentRotate ?? 0) * Math.PI / 180

  const reset = () => {
    setOffset({ x: 0, y: 0 })
    setDragStartPosition(undefined)
  }

  useKey((e) => e.key === 'Escape',reset , [setDragStartPosition])

  return {
    offset,
    reset,
    startPosition: dragStartPosition,
    onStart(p: Position, startPosition?: Partial<Position & { data: T }>) {
      setDragStartPosition({
        x: p.x - (startPosition?.x ?? 0),
        y: p.y - (startPosition?.y ?? 0),
        data: startPosition?.data,
      })
    },
    mask: dragStartPosition && <DragMask
      ignoreLeavingEvent={options?.ignoreLeavingEvent}
      onDragging={(e) => {
        const p = { x: e.clientX, y: e.clientY }
        let f = options?.transform?.(p) ?? p
        f = getAngleSnapPosition(dragStartPosition, f, options?.getAngleSnap)
        const x = (f.x - dragStartPosition.x) / scale
        const y = (f.y - dragStartPosition.y) / scale
        const sin = Math.sin(parentRotate)
        const cos = Math.cos(parentRotate)
        const r = {
          x: cos * x - sin * y,
          y: sin * x + cos * y,
        }
        setOffset(options?.transformOffset?.(r, e) ?? r)
      }}
      onDragEnd={() => {
        onDragEnd?.()
        if (options?.repeatedly) return
        setOffset({ x: 0, y: 0 })
        setDragStartPosition(undefined)
      }}
    />
  }
}
