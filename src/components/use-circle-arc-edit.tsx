import * as React from "react"

import { DragMask, useKey } from "."
import { Arc, Position } from ".."
import { getTwoPointsDistance } from "../utils"

export function useCircleArcEdit<T = void>(
  setCircleOffset: (offset: Arc & { data?: T }) => void,
  onEditEnd: () => void,
) {
  const [dragStartPosition, setDragStartPosition] = React.useState<Position & { data: CircleArcEditData<T> }>()

  useKey((e) => e.key === 'Escape', () => {
    setCircleOffset({ x: 0, y: 0, r: 0, startAngle: 0, endAngle: 0 })
    setDragStartPosition(undefined)
  }, [setDragStartPosition])

  return {
    onStartEditCircle(e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, data: CircleArcEditData<T>) {
      e.stopPropagation()
      setDragStartPosition({
        x: e.clientX,
        y: e.clientY,
        data,
      })
    },
    circleEditMask: dragStartPosition && <DragMask
      onDragging={(e) => {
        e.stopPropagation()
        if (dragStartPosition.data.type === 'center') {
          const x = e.clientX - dragStartPosition.x
          const y = e.clientY - dragStartPosition.y
          setCircleOffset({ x, y, r: 0, startAngle: 0, endAngle: 0, data: dragStartPosition.data.data })
        } else if (dragStartPosition.data.type === 'radius') {
          const r = getTwoPointsDistance({ x: e.clientX, y: e.clientY }, dragStartPosition.data) - dragStartPosition.data.r
          setCircleOffset({ x: 0, y: 0, r, startAngle: 0, endAngle: 0, data: dragStartPosition.data.data })
        } else if (dragStartPosition.data.type === 'start angle') {
          const angle = Math.atan2(e.clientY - dragStartPosition.data.y, e.clientX - dragStartPosition.data.x) * 180 / Math.PI - dragStartPosition.data.startAngle
          setCircleOffset({ x: 0, y: 0, r: 0, startAngle: angle, endAngle: 0, data: dragStartPosition.data.data })
        } else if (dragStartPosition.data.type === 'end angle') {
          const angle = Math.atan2(e.clientY - dragStartPosition.data.y, e.clientX - dragStartPosition.data.x) * 180 / Math.PI - dragStartPosition.data.endAngle
          setCircleOffset({ x: 0, y: 0, r: 0, startAngle: 0, endAngle: angle, data: dragStartPosition.data.data })
        }
      }}
      onDragEnd={() => {
        onEditEnd()
        setCircleOffset({ x: 0, y: 0, r: 0, startAngle: 0, endAngle: 0 })
        setDragStartPosition(undefined)
      }}
      style={{
        cursor: dragStartPosition.data.cursor,
      }}
    />,
  }
}

export interface CircleArcEditData<T = void> extends Arc {
  type: 'center' | 'start angle' | 'end angle' | 'radius'
  cursor: React.CSSProperties['cursor']
  data?: T
}
