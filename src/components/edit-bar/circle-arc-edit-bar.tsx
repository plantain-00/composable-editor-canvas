import * as React from "react"
import { getResizeCursor } from "../../utils"
import { EditBar } from "./edit-bar"

/**
 * @public
 */
export function CircleArcEditBar(props: {
  x: number,
  y: number
  r: number
  startAngle: number
  endAngle: number
  scale?: number
  resizeSize?: number
  onClick?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, type: 'center' | 'start angle' | 'end angle' | 'radius', cursor: React.CSSProperties['cursor']) => void
  onMouseDown?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, type: 'center' | 'start angle' | 'end angle' | 'radius', cursor: React.CSSProperties['cursor']) => void
}) {
  const x = props.x
  const y = props.y
  const startAngle = props.startAngle / 180 * Math.PI
  const endAngle = props.endAngle / 180 * Math.PI
  const middleAngle = (startAngle + endAngle) / 2

  const positions = [
    {
      data: 'center' as const,
      x,
      y,
      cursor: 'move',
    },
    {
      data: 'start angle' as const,
      x: x + props.r * Math.cos(startAngle),
      y: y + props.r * Math.sin(startAngle),
      cursor: getResizeCursor(props.startAngle, 'top'),
    },
    {
      data: 'end angle' as const,
      x: x + props.r * Math.cos(endAngle),
      y: y + props.r * Math.sin(endAngle),
      cursor: getResizeCursor(props.endAngle, 'top'),
    },
    {
      data: 'radius' as const,
      x: x + props.r * Math.cos(middleAngle),
      y: y + props.r * Math.sin(middleAngle),
      cursor: getResizeCursor((props.startAngle + props.endAngle) / 2, 'right'),
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
