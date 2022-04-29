import * as React from "react"

import { DragMask, useKey } from "."
import { Circle, Position } from ".."
import { getTwoPointsDistance } from "../utils"

export function useCircleEdit<T = void>(
  setCircleOffset: (offset: Circle & { data?: T }) => void,
  onEditEnd: () => void,
) {
  const [dragStartPosition, setDragStartPosition] = React.useState<Position & { data: CircleEditData<T> }>()

  useKey((e) => e.key === 'Escape', () => {
    setCircleOffset({ x: 0, y: 0, r: 0 })
    setDragStartPosition(undefined)
  }, [setDragStartPosition])

  return {
    onStartEditCircle(e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, data: CircleEditData<T>) {
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
          setCircleOffset({ x, y, r: 0, data: dragStartPosition.data.data })
        } else {
          const r = getTwoPointsDistance({ x: e.clientX, y: e.clientY }, dragStartPosition.data) - dragStartPosition.data.r
          setCircleOffset({ x: 0, y: 0, r, data: dragStartPosition.data.data })
        }
      }}
      onDragEnd={() => {
        onEditEnd()
        setCircleOffset({ x: 0, y: 0, r: 0 })
        setDragStartPosition(undefined)
      }}
      style={{
        cursor: dragStartPosition.data.cursor,
      }}
    />,
  }
}

export interface CircleEditData<T = void> {
  x: number
  y: number
  r: number
  type: 'center' | 'edge'
  cursor: React.CSSProperties['cursor']
  data?: T
}
