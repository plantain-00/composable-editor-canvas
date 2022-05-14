import { Ellipse } from "../.."
import { getTwoPointsDistance, Position } from "../../utils"
import { useEdit } from "./use-edit"

export function useEllipseEdit<T = void>(
  setEllipseOffset: (offset: Ellipse & { data?: T }) => void,
  onEditEnd: () => void,
  options?: Partial<{
    transform: (p: Position) => Position
  }>
) {
  const { onStartEdit, editMask } = useEdit<{ type: 'center' | 'major axis' | 'minor axis' } & Ellipse, T>(
    onEditEnd,
    (start, end) => {
      if (start.data.type === 'center') {
        const cx = end.x - start.x
        const cy = end.y - start.y
        setEllipseOffset({ cx, cy, rx: 0, ry: 0, data: start.data.data })
      } else {
        const r = getTwoPointsDistance(end, { x: start.data.cx, y: start.data.cy })
        if (start.data.type === 'major axis') {
          setEllipseOffset({ cx: 0, cy: 0, rx: r - start.data.rx, ry: 0, data: start.data.data })
        } else {
          setEllipseOffset({ cx: 0, cy: 0, rx: 0, ry: r - start.data.ry, data: start.data.data })
        }
      }
    },
    () => setEllipseOffset({ cx: 0, cy: 0, rx: 0, ry: 0 }),
    options,
  )

  return {
    onStartEditEllipse: onStartEdit,
    ellipseEditMask: editMask,
  }
}
