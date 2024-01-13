import * as React from "react"
import { Position } from "../utils/position"
import { getTwoPointsRadian } from "../utils/radian"
import { getAngleSnapPosition } from "../utils/snap"
import { DragMask } from "./drag-mask"
import { radianToAngle } from "../utils/radian"

/**
 * @public
 */
export function useDragRotate(
  onDragEnd: () => void,
  options?: Partial<{
    transform: (p: Position) => Position
    parentRotate: number
    ignoreLeavingEvent: boolean
    transformOffset: (p: number, e?: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => number
    getAngleSnap: (angle: number) => number | undefined
  }>,
) {
  const [offset, setOffset] = React.useState<Position & { angle?: number }>()
  const [center, setCenter] = React.useState<Position>()
  const parentRotate = options?.parentRotate ?? 0
  const resetDragRotate = () => {
    setOffset(undefined)
    setCenter(undefined)
  }
  return {
    offset,
    center,
    onStart: setCenter,
    resetDragRotate,
    mask: center && <DragMask
      ignoreLeavingEvent={options?.ignoreLeavingEvent}
      onDragging={(e) => {
        const f = { x: e.clientX, y: e.clientY }
        let p = options?.transform?.(f) ?? f
        p = getAngleSnapPosition(center, p, options?.getAngleSnap)
        const rotate = (radianToAngle(getTwoPointsRadian(p, center)) + 450 - parentRotate) % 360
        setOffset({
          ...p,
          angle: options?.transformOffset?.(rotate, e) ?? rotate,
        })
      }}
      onDragEnd={() => {
        onDragEnd?.()
        resetDragRotate()
      }}
    />
  }
}
