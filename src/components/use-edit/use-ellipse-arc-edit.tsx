import { EllipseArc, rotatePositionByCenter, Position } from "../../utils"
import { useEdit } from "./use-edit"

export function useEllipseArcEdit<T = void>(
  setEllipseOffset: (offset: EllipseArc & { data?: T }) => void,
  onEditEnd: () => void,
  options?: Partial<{
    transform: (p: Position) => Position
  }>
) {
  const { onStartEdit, editMask } = useEdit<{ type: 'center' | 'start angle' | 'end angle' } & EllipseArc, T>(
    onEditEnd,
    (start, end) => {
      if (start.data.type === 'center') {
        const cx = end.x - start.x
        const cy = end.y - start.y
        setEllipseOffset({ cx, cy, rx: 0, ry: 0, startAngle: 0, endAngle: 0, data: start.data.data })
      } else if (start.data.type === 'start angle') {
        const p = rotatePositionByCenter(end, { x: start.data.cx, y: start.data.cy }, start.data.angle ?? 0)
        const angle = Math.atan2((p.y - start.data.cy) / start.data.ry, (p.x - start.data.cx) / start.data.rx) * 180 / Math.PI - start.data.startAngle
        setEllipseOffset({ cx: 0, cy: 0, rx: 0, ry: 0, startAngle: angle, endAngle: 0, data: start.data.data })
      } else if (start.data.type === 'end angle') {
        const p = rotatePositionByCenter(end, { x: start.data.cx, y: start.data.cy }, start.data.angle ?? 0)
        const angle = Math.atan2((p.y - start.data.cy) / start.data.ry, (p.x - start.data.cx) / start.data.rx) * 180 / Math.PI - start.data.endAngle
        setEllipseOffset({ cx: 0, cy: 0, rx: 0, ry: 0, startAngle: 0, endAngle: angle, data: start.data.data })
      }
    },
    () => setEllipseOffset({ cx: 0, cy: 0, rx: 0, ry: 0, startAngle: 0, endAngle: 0 }),
    options,
  )

  return {
    onStartEditEllipseArc: onStartEdit,
    ellipseArcEditMask: editMask,
  }
}
