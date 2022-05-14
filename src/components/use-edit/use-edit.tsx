import * as React from "react"
import { DragMask, useKey } from ".."
import { Position } from "../.."
import { reverseTransformPosition, Transform2 } from "../../utils"

type EditData<T, V> = V & {
  data?: T
  cursor: React.CSSProperties['cursor']
}

export function useEdit<V, T = void>(
  onEditEnd: () => void,
  onDragging: (start: Position & { data: EditData<T, V> }, end: Position) => void,
  reset: () => void,
  options?: Partial<{
    transform2: Transform2
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
        ...reverseTransformPosition({ x: e.clientX, y: e.clientY }, options?.transform2),
        data,
      })
    },
    editMask: dragStartPosition && <DragMask
      onDragging={(e) => {
        e.stopPropagation()
        onDragging(dragStartPosition, reverseTransformPosition({ x: e.clientX, y: e.clientY }, options?.transform2))
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
