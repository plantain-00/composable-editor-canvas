import * as React from "react"

import { DragMask, useKey } from "."
import { Position, Transform, transformPosition } from ".."

export function useDragRotate(
  setRotate: (rotate: number | undefined, e?: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => void,
  onDragEnd: () => void,
  options?: Partial<{
    transform?: Partial<Transform>
    parentRotate: number
  }>,
) {
  const [center, setCenter] = React.useState<Position>()
  const parentRotate = options?.parentRotate ?? 0
  useKey((e) => e.key === 'Escape', () => {
    setRotate(undefined)
    setCenter(undefined)
  })
  return {
    dragRotateCenter: center,
    onStartRotate: setCenter,
    dragRotateMask: center && <DragMask
      onDragging={(e) => {
        const { x, y } = transformPosition({ x: e.clientX, y: e.clientY }, options?.transform)
        const rotate = (Math.atan2(y - center.y, x - center.x) / Math.PI * 180 + 450 - parentRotate) % 360
        setRotate(rotate, e)
      }}
      onDragEnd={() => {
        onDragEnd?.()
        setCenter(undefined)
      }}
    />
  }
}
