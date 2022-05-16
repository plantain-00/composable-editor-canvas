import * as React from "react"

import { DragMask, getAngleSnapPosition, useKey } from "."
import { getResizeCursor, Position, Region, ResizeDirection } from ".."

export function useDragResize(
  onDragEnd: () => void,
  options?: Partial<{
    centeredScaling: boolean | ((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => boolean)
    keepRatio: number | undefined | ((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => number | undefined)
    rotate: number
    parentRotate: number
    transform: (p: Position) => Position
    transformOffset: (p: Region, e?: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, direction?: ResizeDirection) => Region
    getAngleSnap: (angle: number) => number | undefined
  }>,
) {
  const [offset, setOffset] = React.useState({ x: 0, y: 0, width: 0, height: 0 })
  const [dragStartPosition, setDragStartPosition] = React.useState<Position & { direction: ResizeDirection }>()
  const rotate = -(options?.rotate ?? 0) * Math.PI / 180
  const parentRotate = -(options?.parentRotate ?? 0) * Math.PI / 180
  const [cursorPosition, setCursorPosition] = React.useState<Position>()
  useKey((e) => e.key === 'Escape', () => {
    setOffset({ x: 0, y: 0, width: 0, height: 0 })
    setDragStartPosition(undefined)
  }, [setDragStartPosition])

  return {
    offset,
    cursorPosition,
    startPosition: dragStartPosition,
    onStart(e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, direction: ResizeDirection) {
      e.stopPropagation()
      const p = { x: e.clientX, y: e.clientY }
      setDragStartPosition({
        ...options?.transform?.(p) ?? p,
        direction,
      })
    },
    mask: dragStartPosition && <DragMask
      onDragging={(e) => {
        let p = { x: e.clientX, y: e.clientY }
        p = options?.transform?.(p) ?? p
        p = getAngleSnapPosition(dragStartPosition, p, options?.getAngleSnap)
        setCursorPosition(p)
        const { x: positionX, y: positionY } = p
        const originalOffsetX = positionX - dragStartPosition.x
        const originalOffsetY = positionY - dragStartPosition.y

        const parentSin = Math.sin(parentRotate)
        const parentCos = Math.cos(parentRotate)
        const parentOffsetX = parentCos * originalOffsetX - parentSin * originalOffsetY
        const parentOffsetY = parentSin * originalOffsetX + parentCos * originalOffsetY

        if (dragStartPosition.direction === 'center') {
          const f = { x: parentOffsetX, y: parentOffsetY, width: 0, height: 0 }
          setOffset(options?.transformOffset?.(f, e, dragStartPosition.direction) ?? f)
          return
        }

        const sin = Math.sin(rotate)
        const cos = Math.cos(rotate)
        let offsetX = cos * parentOffsetX - sin * parentOffsetY
        let offsetY = sin * parentOffsetX + cos * parentOffsetY
        const scaleX = dragStartPosition.direction.includes('right') ? 1 : dragStartPosition.direction.includes('left') ? -1 : 0
        const scaleY = dragStartPosition.direction.includes('bottom') ? 1 : dragStartPosition.direction.includes('top') ? -1 : 0
        const isCenteredScaling = typeof options?.centeredScaling === 'boolean' ? options.centeredScaling : options?.centeredScaling?.(e)
        const ratio = typeof options?.keepRatio === 'number' ? options.keepRatio : options?.keepRatio?.(e)
        if (ratio) {
          if (dragStartPosition.direction === 'left' || dragStartPosition.direction === 'right' || dragStartPosition.direction === 'top' || dragStartPosition.direction === 'bottom') {
            return
          }
          const x = offsetX * scaleX
          const y = offsetY * scaleY
          offsetX = Math.min(y * ratio, x) * scaleX
          offsetY = Math.min(x / ratio, y) * scaleY
        }
        const offset = {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        }
        offset.width = offsetX * (isCenteredScaling ? 2 : 1) * scaleX
        offset.height = offsetY * (isCenteredScaling ? 2 : 1) * scaleY
        if (isCenteredScaling) {
          offset.x -= offsetX * scaleX
          offset.y -= offsetY * scaleY
        } else {
          if (dragStartPosition.direction.includes('left')) {
            offset.x += (cos + 1) * offsetX / 2
            offset.y -= sin * offsetX / 2
          }
          if (dragStartPosition.direction.includes('right')) {
            offset.x += (cos - 1) * offsetX / 2
            offset.y -= sin * offsetX / 2
          }
          if (dragStartPosition.direction.includes('top')) {
            offset.x += sin * offsetY / 2
            offset.y += (cos + 1) * offsetY / 2
          }
          if (dragStartPosition.direction.includes('bottom')) {
            offset.x += sin * offsetY / 2
            offset.y += (cos - 1) * offsetY / 2
          }
        }
        setOffset(options?.transformOffset?.(offset, e, dragStartPosition.direction) ?? offset)
      }}
      onDragEnd={() => {
        onDragEnd()
        setOffset({ x: 0, y: 0, width: 0, height: 0 })
        setDragStartPosition(undefined)
      }}
      style={{
        cursor: getResizeCursor((options?.rotate ?? 0) + (options?.parentRotate ?? 0), dragStartPosition.direction),
      }}
    />,
  }
}
