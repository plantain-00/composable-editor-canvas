import * as React from "react"

import { DragMask, getAngleSnapPosition, useKey } from "."
import { Position } from ".."

export function useDragRotate(
  onDragEnd: () => void,
  options?: Partial<{
    transform: (p: Position) => Position
    parentRotate: number
    transformOffset: (p: number, e?: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => number
    getAngleSnap: (angle: number) => number | undefined
  }>,
) {
  const [offset, setOffset] = React.useState<Position & { angle?: number }>()
  const [center, setCenter] = React.useState<Position>()
  const parentRotate = options?.parentRotate ?? 0
  useKey((e) => e.key === 'Escape', () => {
    setOffset(undefined)
    setCenter(undefined)
  }, [setCenter])
  return {
    offset,
    center,
    onStart: setCenter,
    mask: center && <DragMask
      onDragging={(e) => {
        const f = { x: e.clientX, y: e.clientY }
        let p = options?.transform?.(f) ?? f
        p = getAngleSnapPosition(center, p, options?.getAngleSnap)
        const rotate = (Math.atan2(p.y - center.y, p.x - center.x) / Math.PI * 180 + 450 - parentRotate) % 360
        setOffset({
          ...p,
          angle: options?.transformOffset?.(rotate, e) ?? rotate,
        })
      }}
      onDragEnd={() => {
        onDragEnd?.()
        setOffset(undefined)
        setCenter(undefined)
      }}
    />
  }
}
