import * as React from "react"
import { EditBar } from "./edit-bar"

/**
 * @public
 */
export function CircleEditBar(props: {
  x: number,
  y: number
  radius: number
  scale?: number
  resizeSize?: number
  onClick?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, type: 'center' | 'edge', cursor: React.CSSProperties['cursor']) => void
  onMouseDown?: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>, type: 'center' | 'edge', cursor: React.CSSProperties['cursor']) => void
}) {
  const x = props.x
  const y = props.y

  const positions = [
    {
      data: 'center' as const,
      x,
      y,
      cursor: 'move',
    },
    {
      data: 'edge' as const,
      x: x - props.radius,
      y,
      cursor: 'ew-resize',
    },
    {
      data: 'edge' as const,
      x,
      y: y - props.radius,
      cursor: 'ns-resize',
    },
    {
      data: 'edge' as const,
      x: x + props.radius,
      y,
      cursor: 'ew-resize',
    },
    {
      data: 'edge' as const,
      x,
      y: y + props.radius,
      cursor: 'ns-resize',
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
