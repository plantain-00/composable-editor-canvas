
import { Circle } from "../.."
import { getTwoPointsDistance, Position } from "../../utils"
import { useEdit } from "./use-edit"

export function useCircleEdit<T = void>(
  setCircleOffset: (offset: Circle & { data?: T }) => void,
  onEditEnd: () => void,
  options?: Partial<{
    transform: (p: Position) => Position
  }>
) {
  const { onStartEdit, editMask } = useEdit<{ type: 'center' | 'edge' } & Circle, T>(
    onEditEnd,
    (start, end) => {
      if (start.data.type === 'center') {
        const x = end.x - start.x
        const y = end.y - start.y
        setCircleOffset({ x, y, r: 0, data: start.data.data })
      } else {
        const r = getTwoPointsDistance(end, start.data) - start.data.r
        setCircleOffset({ x: 0, y: 0, r, data: start.data.data })
      }
    },
    () => setCircleOffset({ x: 0, y: 0, r: 0 }),
    options,
  )

  return {
    onStartEditCircle: onStartEdit,
    circleEditMask: editMask,
  }
}
