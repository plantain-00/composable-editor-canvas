import * as React from "react"

import { DragMask } from "."

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
    onStartRotate: setCenter,
    dragRotateMask: center && <DragMask
      onDragging={(e) => {
        const { x, y } = transformPosition(e.clientX, e.clientY, transform)
        setRotate(Math.round((Math.atan2(y - center.y, x - center.x) / Math.PI * 180 + 450) % 360))
      }}
      onDragEnd={() => {
        onDragEnd?.()
        setCenter(undefined)
      }}
    />
  }
}

export function transformPosition(
  x: number,
  y: number,
  transform?: Partial<{
    containerSize: { width: number, height: number }
    targetSize: { width: number, height: number }
    x: number
    y: number
    scale: number
  }>,
) {
  const positionX = (transform?.targetSize?.width ?? 0) / 2 - ((transform?.containerSize?.width ?? 0) / 2 - x + (transform?.x ?? 0)) / (transform?.scale ?? 1)
  const positionY = (transform?.targetSize?.height ?? 0) / 2 - ((transform?.containerSize?.height ?? 0) / 2 - y + (transform?.y ?? 0)) / (transform?.scale ?? 1)
  return {
    x: positionX,
    y: positionY,
  }
}
