import * as React from "react"
import { EllipseArc, getResizeCursor, rotatePositionByCenter } from "../../utils"
import { EditBar } from "./edit-bar"

/**
 * @public
 */
export function EllipseArcEditBar(props: EllipseArc & {
  scale?: number
  resizeSize?: number
  onClick?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, type: 'center' | 'start angle' | 'end angle', cursor: React.CSSProperties['cursor']) => void
  onMouseDown?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, type: 'center' | 'start angle' | 'end angle', cursor: React.CSSProperties['cursor']) => void
}) {
  const center = { x: props.cx, y: props.cy }
  const startAngle = props.startAngle / 180 * Math.PI
  const endAngle = props.endAngle / 180 * Math.PI
  const rotate = -(props.angle ?? 0)

  const positions = [
    {
      data: 'center' as const,
      x: props.cx,
      y: props.cy,
      cursor: 'move',
    },
    {
      data: 'start angle' as const,
      ...rotatePositionByCenter({ x: props.cx + props.rx * Math.cos(startAngle), y: props.cy + props.ry * Math.sin(startAngle) }, center, rotate),
      cursor: getResizeCursor(props.startAngle - rotate, 'top'),
    },
    {
      data: 'end angle' as const,
      ...rotatePositionByCenter({ x: props.cx + props.rx * Math.cos(endAngle), y: props.cy + props.ry * Math.sin(endAngle) }, center, rotate),
      cursor: getResizeCursor(props.endAngle - rotate, 'top'),
    },
  ]

  return (
    <EditBar
      positions={positions}
      scale={props.scale}
      resizeSize={props.resizeSize}
      onClick={props.onClick}
      onMouseDown={props.onMouseDown}
    />
  )
}
