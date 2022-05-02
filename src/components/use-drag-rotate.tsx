import * as React from "react"

import { DragMask, useKey } from "."
import { Position, Transform, transformPosition } from ".."

export function useDragRotate(
  setRotate: (rotate: number | undefined, e?: { clientX: number, clientY: number }) => void,
  onDragEnd: () => void,
  options?: Partial<{
    transform?: Partial<Transform>
    parentRotate: number
    getSnapPoint: (p: { clientX: number, clientY: number }) => { clientX: number, clientY: number }
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
        const f = options?.getSnapPoint?.(e) ?? e
        const { x, y } = transformPosition({ x: f.clientX, y: f.clientY }, options?.transform)
        const rotate = (Math.atan2(y - center.y, x - center.x) / Math.PI * 180 + 450 - parentRotate) % 360
        setRotate(rotate, f)
      }}
      onDragEnd={() => {
        onDragEnd?.()
        setRotate(undefined)
        setCenter(undefined)
      }}
    />
  }
}
