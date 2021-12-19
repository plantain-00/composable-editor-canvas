import * as React from "react"

import { DragMask } from "."
import { transformPosition } from ".."

export function useDragRotate(
  setRotate: (rotate: number) => void,
  onDragEnd: () => void,
  transform?: Partial<{
    containerSize: { width: number, height: number }
    targetSize: { width: number, height: number }
    x: number
    y: number
    scale: number
  }>,
) {
  const [center, setCenter] = React.useState<{ x: number, y: number }>()

  return {
    dragRotateCenter: center,
    onStartRotate: setCenter,
    dragRotateMask: center && <DragMask
      onDragging={(e) => {
        const { x, y } = transformPosition({ x: e.clientX, y: e.clientY }, transform)
        setRotate(Math.round((Math.atan2(y - center.y, x - center.x) / Math.PI * 180 + 450) % 360))
      }}
      onDragEnd={() => {
        onDragEnd?.()
        setCenter(undefined)
      }}
    />
  }
}
