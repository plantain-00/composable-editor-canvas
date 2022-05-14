import * as React from "react"
import { DragMask, useKey } from ".."
import { Position } from "../.."

type EditData<T, V> = V & {
  data?: T
  cursor: React.CSSProperties['cursor']
}

export function useEdit<V, T = void>(
  onEditEnd: () => void,
  onDragging: (start: Position & { data: EditData<T, V> }, end: Position) => void,
  reset: () => void,
  options?: Partial<{
    transform: (p: Position) => Position
  }>
) {

  const [dragStartPosition, setDragStartPosition] = React.useState<Position & { data: EditData<T, V> }>()

  useKey((e) => e.key === 'Escape', () => {
    reset()
    setDragStartPosition(undefined)
  }, [setDragStartPosition])

  return {
    onStartEdit(e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, data: EditData<T, V>) {
      e.stopPropagation()
      setDragStartPosition({
        ...options?.transform?.({ x: e.clientX, y: e.clientY }) ?? { x: e.clientX, y: e.clientY },
        data,
      })
    },
    editMask: dragStartPosition && <DragMask
      onDragging={(e) => {
        e.stopPropagation()
        onDragging(dragStartPosition, options?.transform?.({ x: e.clientX, y: e.clientY }) ?? { x: e.clientX, y: e.clientY })
      }}
      onDragEnd={() => {
        onEditEnd()
        reset()
        setDragStartPosition(undefined)
      }}
      style={{
        cursor: dragStartPosition.data.cursor,
      }}
    />,
  }
}
