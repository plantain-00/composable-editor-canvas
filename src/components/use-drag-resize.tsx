import * as React from "react"
import { getResizeCursor, ResizeDirection } from "../utils/cursor"
import { Position } from "../utils/position"
import { Region } from "../utils/region"
import { getAngleSnapPosition } from "../utils/snap"
import { DragMask } from "./drag-mask"
import { angleToRadian } from "../utils/radian"


/**
 * @public
 */
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
  const rotate = -angleToRadian(options?.rotate)
  const parentRotate = -angleToRadian(options?.parentRotate)
  const [cursorPosition, setCursorPosition] = React.useState<Position>()
  const resetDragResize = () => {
    setOffset({ x: 0, y: 0, width: 0, height: 0 })
    setDragStartPosition(undefined)
  }

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
    resetDragResize,
    mask: dragStartPosition && <DragMask
      onDragging={(e) => {
        let p = { x: e.clientX, y: e.clientY }
        p = options?.transform?.(p) ?? p
        p = getAngleSnapPosition(dragStartPosition, p, options?.getAngleSnap)
        setCursorPosition(p)

        const isCenteredScaling = typeof options?.centeredScaling === 'boolean' ? options.centeredScaling : options?.centeredScaling?.(e)
        const ratio = typeof options?.keepRatio === 'number' ? options.keepRatio : options?.keepRatio?.(e)
        const offset = getResizeOffset(dragStartPosition, p, dragStartPosition.direction, rotate, isCenteredScaling, ratio, parentRotate)
        if (!offset) {
          return
        }
        setOffset(options?.transformOffset?.(offset, e, dragStartPosition.direction) ?? offset)
      }}
      onDragEnd={() => {
        onDragEnd()
        resetDragResize()
      }}
      style={{
        cursor: getResizeCursor((options?.rotate ?? 0) + (options?.parentRotate ?? 0), dragStartPosition.direction),
      }}
    />,
  }
}

/**
 * @public
 */
export function getResizeOffset(
  startPosition: Position,
  cursorPosition: Position,
  direction: ResizeDirection,
  rotate = 0,
  isCenteredScaling?: boolean,
  ratio?: number,
  parentRotate = 0,
) {
  const originalOffsetX = cursorPosition.x - startPosition.x
  const originalOffsetY = cursorPosition.y - startPosition.y

  const parentSin = Math.sin(parentRotate)
  const parentCos = Math.cos(parentRotate)
  const parentOffsetX = parentCos * originalOffsetX - parentSin * originalOffsetY
  const parentOffsetY = parentSin * originalOffsetX + parentCos * originalOffsetY

  if (direction === 'center') {
    return { x: parentOffsetX, y: parentOffsetY, width: 0, height: 0 }
  }

  const sin = Math.sin(rotate)
  const cos = Math.cos(rotate)
  let offsetX = cos * parentOffsetX - sin * parentOffsetY
  let offsetY = sin * parentOffsetX + cos * parentOffsetY
  const scaleX = direction.includes('right') ? 1 : direction.includes('left') ? -1 : 0
  const scaleY = direction.includes('bottom') ? 1 : direction.includes('top') ? -1 : 0
  if (ratio) {
    if (direction === 'left' || direction === 'right' || direction === 'top' || direction === 'bottom') {
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
    if (direction.includes('left')) {
      offset.x += (cos + 1) * offsetX / 2
      offset.y -= sin * offsetX / 2
    }
    if (direction.includes('right')) {
      offset.x += (cos - 1) * offsetX / 2
      offset.y -= sin * offsetX / 2
    }
    if (direction.includes('top')) {
      offset.x += sin * offsetY / 2
      offset.y += (cos + 1) * offsetY / 2
    }
    if (direction.includes('bottom')) {
      offset.x += sin * offsetY / 2
      offset.y += (cos - 1) * offsetY / 2
    }
  }
  return offset
}
