import * as React from "react"

import { DragMask, useKey } from "."
import { Position } from ".."

export function useDragRotate(
  setRotate: (rotate: number | undefined, e?: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => void,
  onDragEnd: () => void,
  options?: Partial<{
    transform: (p: Position) => Position
    parentRotate: number
    getSnapPoint(p: Position): Position
  }>,
) {
  const [center, setCenter] = React.useState<Position>()
  const parentRotate = options?.parentRotate ?? 0
  useKey((e) => e.key === 'Escape', () => {
    setRotate(undefined)
    setCenter(undefined)
  }, [setCenter])
  return {
    dragRotateCenter: center,
    onStartRotate: setCenter,
    dragRotateMask: center && <DragMask
      onDragging={(e) => {
        const p = { x: e.clientX, y: e.clientY }
        const f = options?.getSnapPoint?.(p) ?? p
        const { x, y } = options?.transform?.(f) ?? f
        const rotate = (Math.atan2(y - center.y, x - center.x) / Math.PI * 180 + 450 - parentRotate) % 360
        setRotate(rotate, e)
      }}
      onDragEnd={() => {
        onDragEnd?.()
        setRotate(undefined)
        setCenter(undefined)
      }}
    />
  }
}
