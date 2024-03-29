import * as React from "react"
import { DragMask } from ".."
import { Position } from "../.."

/**
 * @public
 */
export type EditData<T, V> = V & {
  data?: T
  cursor: React.CSSProperties['cursor']
}

/**
 * @public
 */
export type EditOptions = Partial<{
  transform: (p: Position) => Position
  getAngleSnap: (angle: number) => number | undefined
}>

/**
 * @public
 */
export function useDragEdit<V, T = void>(
  onEnd: () => void,
  onDragging: (start: Position & { data: EditData<T, V> }, end: Position) => void,
  options?: Partial<{
    transform: (p: Position) => Position
  }>,
) {
  const [dragStartPosition, setDragStartPosition] = React.useState<Position & { data: EditData<T, V> }>()

  return {
    dragStartPosition,
    onStart(e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, data: EditData<T, V>) {
      e.stopPropagation()
      setDragStartPosition({
        ...options?.transform?.({ x: e.clientX, y: e.clientY }) ?? { x: e.clientX, y: e.clientY },
        data,
      })
    },
    reset() {
      setDragStartPosition(undefined)
    },
    mask: dragStartPosition && <DragMask
      onDragging={(e) => {
        e.stopPropagation()
        let f = { x: e.clientX, y: e.clientY }
        f = options?.transform?.(f) ?? f
        onDragging(dragStartPosition, f)
      }}
      onDragEnd={() => {
        onEnd()
        setDragStartPosition(undefined)
      }}
      style={{
        cursor: dragStartPosition.data.cursor,
      }}
    />,
  }
}
