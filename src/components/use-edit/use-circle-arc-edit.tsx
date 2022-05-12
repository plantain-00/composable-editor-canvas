import { Arc } from "../.."
import { getTwoPointsDistance } from "../../utils"
import { useEdit } from "./use-edit"

export function useCircleArcEdit<T = void>(
  setCircleOffset: (offset: Arc & { data?: T }) => void,
  onEditEnd: () => void,
) {
  const { onStartEdit, editMask } = useEdit<{ type: 'center' | 'start angle' | 'end angle' | 'radius' } & Arc, T>(
    onEditEnd,
    (start, end) => {
      if (start.data.type === 'center') {
        const x = end.x - start.x
        const y = end.y - start.y
        setCircleOffset({ x, y, r: 0, startAngle: 0, endAngle: 0, data: start.data.data })
      } else if (start.data.type === 'radius') {
        const r = getTwoPointsDistance(end, start.data) - start.data.r
        setCircleOffset({ x: 0, y: 0, r, startAngle: 0, endAngle: 0, data: start.data.data })
      } else if (start.data.type === 'start angle') {
        const angle = Math.atan2(end.y - start.data.y, end.x - start.data.x) * 180 / Math.PI - start.data.startAngle
        setCircleOffset({ x: 0, y: 0, r: 0, startAngle: angle, endAngle: 0, data: start.data.data })
      } else if (start.data.type === 'end angle') {
        const angle = Math.atan2(end.y - start.data.y, end.x - start.data.x) * 180 / Math.PI - start.data.endAngle
        setCircleOffset({ x: 0, y: 0, r: 0, startAngle: 0, endAngle: angle, data: start.data.data })
      }
    },
    () => setCircleOffset({ x: 0, y: 0, r: 0, startAngle: 0, endAngle: 0 }),
  )

  return {
    onStartEditCircle: onStartEdit,
    circleEditMask: editMask,
  }
}
