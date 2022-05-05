import * as React from "react"

import { DragMask, useKey } from "."
import { Ellipse, Position } from ".."
import { getTwoPointsDistance } from "../utils"

export function useEllipseEdit<T = void>(
  setEllipseOffset: (offset: Ellipse & { data?: T }) => void,
  onEditEnd: () => void,
) {
  const [dragStartPosition, setDragStartPosition] = React.useState<Position & { data: EllipseEditData<T> }>()

  useKey((e) => e.key === 'Escape', () => {
    setEllipseOffset({ cx: 0, cy: 0, rx: 0, ry: 0 })
    setDragStartPosition(undefined)
  }, [setDragStartPosition])

  return {
    onStartEditEllipse(e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, data: EllipseEditData<T>) {
      e.stopPropagation()
      setDragStartPosition({
        x: e.clientX,
        y: e.clientY,
        data,
      })
    },
    ellipseEditMask: dragStartPosition && <DragMask
      onDragging={(e) => {
        e.stopPropagation()
        if (dragStartPosition.data.type === 'center') {
          const cx = e.clientX - dragStartPosition.x
          const cy = e.clientY - dragStartPosition.y
          setEllipseOffset({ cx, cy, rx: 0, ry: 0, data: dragStartPosition.data.data })
        } else {
          const r = getTwoPointsDistance({ x: e.clientX, y: e.clientY }, { x: dragStartPosition.data.cx, y: dragStartPosition.data.cy })
          if (dragStartPosition.data.type === 'major axis') {
            setEllipseOffset({ cx: 0, cy: 0, rx: r - dragStartPosition.data.rx, ry: 0, data: dragStartPosition.data.data })
          } else {
            setEllipseOffset({ cx: 0, cy: 0, rx: 0, ry: r - dragStartPosition.data.ry, data: dragStartPosition.data.data })
          }
        }
      }}
      onDragEnd={() => {
        onEditEnd()
        setEllipseOffset({ cx: 0, cy: 0, rx: 0, ry: 0 })
        setDragStartPosition(undefined)
      }}
      style={{
        cursor: dragStartPosition.data.cursor,
      }}
    />,
  }
}

export interface EllipseEditData<T = void> {
  cx: number
  cy: number
  rx: number
  ry: number
  type: 'center' | 'major axis' | 'minor axis'
  cursor: React.CSSProperties['cursor']
  data?: T
}
