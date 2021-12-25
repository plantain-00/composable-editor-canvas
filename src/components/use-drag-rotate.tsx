import * as React from "react"

import { DragMask } from "."
import { Transform, transformPosition } from ".."

export function useDragRotate(
  setRotate: (rotate: number) => void,
  onDragEnd: () => void,
  options?: Partial<{
    transform?: Partial<Transform>
    parentRotate: number
  }>,
) {
  const [center, setCenter] = React.useState<{ x: number, y: number }>()
  const parentRotate = options?.parentRotate ?? 0

  return {
    dragRotateCenter: center,
    onStartRotate: setCenter,
    dragRotateMask: center && <DragMask
      onDragging={(e) => {
        const { x, y } = transformPosition({ x: e.clientX, y: e.clientY }, options?.transform)
        setRotate(Math.round((Math.atan2(y - center.y, x - center.x) / Math.PI * 180 + 450 - parentRotate) % 360))
      }}
      onDragEnd={() => {
        onDragEnd?.()
        setCenter(undefined)
      }}
    />
  }
}
