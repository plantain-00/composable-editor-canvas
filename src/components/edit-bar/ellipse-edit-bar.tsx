import * as React from "react"
import { getResizeCursor, rotatePositionByCenter } from "../../utils"
import { EditBar } from "./edit-bar"

/**
 * @public
 */
export function EllipseEditBar(props: {
  cx: number,
  cy: number
  rx: number
  ry: number
  angle?: number
  scale?: number
  resizeSize?: number
  onClick?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, type: 'center' | 'major axis' | 'minor axis', cursor: React.CSSProperties['cursor']) => void
  onMouseDown?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, type: 'center' | 'major axis' | 'minor axis', cursor: React.CSSProperties['cursor']) => void
}) {
  const center = { x: props.cx, y: props.cy }
  const rotate = -(props.angle ?? 0)
  const left = rotatePositionByCenter({ x: props.cx - props.rx, y: props.cy }, center, rotate)
  const right = rotatePositionByCenter({ x: props.cx + props.rx, y: props.cy }, center, rotate)
  const top = rotatePositionByCenter({ x: props.cx, y: props.cy - props.ry }, center, rotate)
  const bottom = rotatePositionByCenter({ x: props.cx, y: props.cy + props.ry }, center, rotate)

  const positions = [
    {
      data: 'center' as const,
      x: props.cx,
      y: props.cy,
      cursor: 'move',
    },
    {
      data: 'major axis' as const,
      x: left.x,
      y: left.y,
      cursor: getResizeCursor(-rotate, 'left'),
    },
    {
      data: 'major axis' as const,
      x: right.x,
      y: right.y,
      cursor: getResizeCursor(-rotate, 'right'),
    },
    {
      data: 'minor axis' as const,
      x: top.x,
      y: top.y,
      cursor: getResizeCursor(-rotate, 'top'),
    },
    {
      data: 'minor axis' as const,
      x: bottom.x,
      y: bottom.y,
      cursor: getResizeCursor(-rotate, 'bottom'),
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
